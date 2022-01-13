#!/bin/env python

from toil_container import ContainerJob
from toil_container import ContainerService
from toil_container import ContainerArgumentParser
from toil.job import Job
from toil.common import RealtimeLogger
from nginx.config.builder import NginxConfigBuilder
from nginx.config.api import Block, Section, Location
from collections import OrderedDict
from threading import Event, Thread

import logging
import portpicker
import json
import os
import subprocess
import traceback
import copy
import socket
import uuid

logger = logging.getLogger(__name__)

def add_plugin():
    return [
        {
          "name": "HGB",
          "url": "https://unpkg.com/jbrowse-plugin-hgb/dist/jbrowse-plugin-hgb.umd.production.min.js"
        }
    ]

def load_json(jsonfile):
    with open(jsonfile) as json_data:
        databank = json.load(json_data, object_pairs_hook=OrderedDict)
    return databank

def cors_track(name, directory, ref_alias):
    return {
      "type": "FeatureTrack",
      "trackId": "hgb_track_{}".format(directory),
      "name": name,
      "category": ["Alignment"],
      "assemblyNames": [ref_alias],
      "adapter": {
        "type": "HgbAdapter",
        "HgbAdapterId": "DefaultHgbAdapterId",
        "base": {
          "uri": "/{}/".format(directory)
        }
      },
      "displays": [
        {
          "displayId": "hgb_display_{}".format(directory),
          "type": "HgbDisplay",
          "renderer": {
            "type": "HgbFeatureRenderer",
            "prefix": ""
          },
          "height": 250
        }
      ]
    }

class JBrowse2Service(ContainerService):
    def __init__(self, fileIds, config, reference, ref_alias, tracks, load, *args, **kwargs):
        ContainerService.__init__(self,  memory="2G", cores=1, disk="3G", *args, **kwargs)
        self.fileIds = fileIds
        self.config = config 
        self.reference = reference
        self.ref_alias = ref_alias
        self.tracks = tracks
        if load is not None:
            self.load = "--load {}".format(load)
        else:
            self.load = None

    def start(self, job):
        assert self.disk is not None
        assert self.memory is not None
        assert self.cores is not None
        self.terminate = Event()
        self.error = Event()

        tempDir = job.fileStore.getLocalTempDir()
        jb2_port = portpicker.pick_unused_port()
        job.fileStore.logToMaster("JBrowse2 start")
        cmds = "jbrowse create {}/jbrowse2".format(tempDir)
        subprocess.run(cmds, shell=True)
        cmds = "jbrowse add-assembly {} --out {}/jbrowse2 --alias {}".format(self.reference, tempDir, self.ref_alias)
        subprocess.run(cmds, shell=True)
        if self.tracks is not None:
            for track in self.tracks:
                cmds = "jbrowse add-track {} --out {}/jbrowse2 {}".format(track, tempDir, self.load)

        nginx = NginxConfigBuilder(daemon='on')
        config = tempDir + "/jbrowse2/config.json"
        server = Section('server', listen=jb2_port, root="/www/data")
        if True:
            config_json = load_json(config)
            config_json["plugins"] = add_plugin()
            for i, fileId in enumerate(self.fileIds):
                port = portpicker.pick_unused_port()
                with job.fileStore.readGlobalFileStream(fileId) as fH:
                    sjson = json.load(fH, object_pairs_hook=OrderedDict)
                    new_track = cors_track(sjson.get("name", fileId), i, self.ref_alias)
                    config_json["tracks"].append(new_track)
                    #cmds = ["nohup", "ssh", "-4", "-N", "-T", "-L", "{0}:{1}:{2}".format(port, "localhost", sjson["port"]), sjson["hostname"]]
                    #cmds = " ".join(cmds) + " &"
                    #subprocess.Popen(cmds)
                    #server.add_route('/{}'.format(i), server="{}:{}".format(sjson["hostname"], sjson["port"])).end()
                    server.sections.add(Location('/{}/'.format(i), proxy_pass="http://{}:{}/".format(sjson["hostname"], sjson["port"])))

        with open(config, mode="w", encoding='utf-8') as file:
            json.dump(config_json, file, ensure_ascii=False, indent=2)

        tempDir2 = job.fileStore.getLocalTempDir()
        nginx_config = tempDir2 + "/default.conf"        
        with open(nginx_config, mode="w", encoding='utf-8') as file:
            print("disable_symlinks off;", file=file)
            print(server, file=file)
        with open(nginx_config) as f:
            s_line = f.read()
            job.fileStore.logToMaster(s_line)

        hostname = os.uname()[1]
        RealtimeLogger.critical("Access to http://{}:{}".format(hostname, jb2_port))
        self.serviceThread = Thread(target=self.serviceWorker,
                                    args=(job.fileStore.jobStore, self.terminate, self.error,
                                          jb2_port, tempDir, tempDir2, self.options, self.call))   
        job.fileStore.logToMaster(str(self.options))
        self.serviceThread.start()
        return "Access to http://{}:{}".format(hostname, jb2_port)
    
    def stop(self, job):
        self.terminate.set()
        self.serviceThread.join()

    def check(self):
        if self.error.isSet():
            raise RuntimeError("Service worker failed")
        return True

    @staticmethod
    def serviceWorker(jobStore, terminate, error, jb2_port, tempDir, tempDir2, options, call):
        try:
            if terminate.isSet():
                logger.debug("Service worker being told to quit")
                return

            options.volumes = [(tempDir + "/jbrowse2", "/www/data/"), (tempDir2, "/etc/nginx/conf.d/")]
            hostname = os.uname()[1]
            RealtimeLogger.info("Access to http://{}:{}".format(hostname, jb2_port))
            call(["nginx", "-g", "daemon off;"])

        except:
            logger.debug("Error in service worker: %s", traceback.format_exc())
            error.set()
            raise

class HGBService(ContainerService):
    def __init__(self, bam, track_name, cache_dir="/tmp/cache", user_pass=None, *args, **kwargs):
        ContainerService.__init__(self, memory="20G", cores=4, disk="3G", *args, **kwargs)
        self.bam = bam
        self.track_name = track_name
        self.cache_dir = cache_dir
        self.user_pass = user_pass

    def start(self, job):
        assert self.disk is not None
        assert self.memory is not None
        assert self.cores is not None
        self.terminate = Event()
        self.error = Event()
        
        port = portpicker.pick_unused_port()
        host = socket.gethostname()
        ip = socket.gethostbyname(host)
        data = {"port": port, "hostname": ip, "name": self.track_name} #data = {"port": port, "hostname": os.uname()[1], "name": self.bam}
        tempDir = job.fileStore.getLocalTempDir()
        scratchFile = job.fileStore.getLocalTempFile()
        with open(scratchFile, mode="w", encoding='utf-8') as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
        fileID = job.fileStore.writeGlobalFile(scratchFile)
        bam = self.bam
        

        self.serviceThread = Thread(target=self.serviceWorker,
                                    args=(job.fileStore.jobStore, self.terminate, self.error,
                                          fileID, port, self.call,
                                          bam, self.cache_dir, self.user_pass)) 
        self.serviceThread.start()
        return fileID


    def stop(self, job):
        self.terminate.set()
        self.serviceThread.join()

    def check(self):
        if self.error.isSet():
            raise RuntimeError("Service worker failed")
        return True

    @staticmethod
    def serviceWorker(jobStore, terminate, error, fileId, port, call, bam, cache_dir, user_pass):
        try:
            if terminate.isSet():
                logger.debug("Service worker being told to quit")
                return

            RealtimeLogger.info("HGB start")
            hgb_cmd = ["hgb", "vis", "-a", bam, "-w", "0.0.0.0:{}".format(port), "-S", "-R", "chr1:1-100000", "-Y", "80", "-r", "chr1:1-1001", "-W", "->", "-#", "jbrowse", "-P", "-%", "-d", cache_dir] # + "/" + str(uuid.uuid4())[:8]]
            if user_pass:
                hgb_cmd.append("-[")
                hgb_cmd.append("{}".format(user_pass))
            call(hgb_cmd)
        except:
            logger.debug("Error in service worker: %s", traceback.format_exc())
            error.set()
            raise


def message(message, memory="1G", cores=1, disk="1G"):
    RealtimeLogger.info(message)
    return f"{message}"

def nginx_config(options):
    docker = getattr(options, "docker", None)
    singularity = getattr(options, "singularity", None) 
    if docker:
        options.docker = "nginxinc/nginx-unprivileged" 
    if singularity:
        options.singularity = "docker://nginxinc/nginx-unprivileged"
    return options

def main():
    parser = ContainerArgumentParser()
    parser.add_argument("-a", "--bam", nargs='+', required=True)
    parser.add_argument("-n", "--track-names", nargs='+')
    parser.add_argument("-c", "--config")
    parser.add_argument("-r", "--reference", default="https://jbrowse.org/genomes/GRCh38/fasta/hg38.prefix.fa.gz")
    parser.add_argument("-l", "--load", choices=["copy", "symlink"])
    parser.add_argument("-A", "--ref-alias", default="hg38")
    parser.add_argument("-u", "--auth")
    parser.add_argument("-t", "--tracks", type=list, nargs='*', help="gff3")

    options = parser.parse_args()
    job = Job()
    files = []
    names = options.bam
    if options.track_names:
      names = options.track_names 
    for i, bam in zip(names, options.bam): 
      #j2 = HGBJob(options=options, bam=bam, fileId=i)
      bam = os.path.abspath(bam)
      bam_dir, bam_file = os.path.split(bam)
      options.volumes = [(bam_dir, "/data/")]
      bam_file = "/data/" + bam_file
      cache_dir = "/tmp/cache/"
      j2 = HGBService(bam_file, i, cache_dir, options.auth, options=options)
      fileid = job.addService(j2)
      files.append(fileid)
    opts = copy.deepcopy(options)
    options = nginx_config(opts)
    #j3 = JBrowse2Job(files, options.config, options.reference, options.jbrowse2, options=options)
    jn = Job()
    j3 = JBrowse2Service(files, options.config, options.reference, options.ref_alias, options.tracks, options.load, options=options) 
    msg = jn.addService(j3)
    job.addChild(jn)
    ContainerJob.Runner.startToil(job, options)

if __name__ == "__main__":
    main()
