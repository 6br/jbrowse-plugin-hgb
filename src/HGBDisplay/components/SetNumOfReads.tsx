import React, { useState } from 'react'
import { observer } from 'mobx-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'

const useStyles = makeStyles(theme => ({
  root: {
    width: 500,
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  field: {
    margin: theme.spacing(2),
  },
}))

function SetNumOfReadsDlg(props: {
  model: {
    numOfReads?: number
    setNumOfReads: Function
  }
  handleClose: () => void
}) {
  const { model, handleClose } = props
  const classes = useStyles()
  const { numOfReads = '' } = model
  const [max, setMax] = useState(`${numOfReads}`)

  return (
    <Dialog open onClose={handleClose}>
      <DialogTitle id="alert-dialog-title">
        Filter options
        <IconButton
          aria-label="close"
          className={classes.closeButton}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className={classes.root}>
          <Typography>Set max number of reads</Typography>
          <TextField
            value={max}
            onChange={event => {
              setMax(event.target.value)
            }}
            placeholder="Enter max number of reads"
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            style={{ marginLeft: 20 }}
            onClick={() => {
              model.setNumOfReads(
                max !== '' && !Number.isNaN(+max) ? +max : undefined,
              )
              handleClose()
            }}
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default observer(SetNumOfReadsDlg)