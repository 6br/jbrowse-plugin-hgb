## If you are developing this plugin

```
git clone https://github.com/cmdcolin/jbrowse-plugin-hgb.git
cd jbrowse-plugin-hgb
yarn
yarn start
```

Then open JBrowse Web to (assuming it is running on port 3000):

http://localhost:3000/?config=http://localhost:9000/config.json

## If you want to use in [@jbrowse/react-linear-genome-view](https://www.npmjs.com/package/@jbrowse/react-linear-genome-view)

```
yarn add jbrowse-plugin-hgb
```

And then load statically via an import

```tsx
import React from "react";
import "fontsource-roboto";
import {
  createViewState,
  createJBrowseTheme,
  JBrowseLinearGenomeView,
  ThemeProvider,
} from "@jbrowse/react-linear-genome-view";
import GWAS from "jbrowse-plugin-hgb";

const theme = createJBrowseTheme();

function View() {
  const state = createViewState({
    assembly: {
      /* assembly */
    },
    tracks: [
      /* tracks */
    ],
    plugins: [GWAS],
  });
  return (
    <ThemeProvider theme={theme}>
      <JBrowseLinearGenomeView viewState={state} />
    </ThemeProvider>
  );
}
```
