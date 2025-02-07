import 'horizon/core';
import {UIComponent, View, Text, UINode} from 'horizon/ui';
let tempArray: UINode[] = [];

for (let i = 0; i < 32; i++) {
  tempArray.push(Text({text: String(i+1), style: {fontSize:24, color: 'white', textAlign: 'center'}}));
}
const textNodes = [...tempArray];
tempArray = [] as UINode[];


class ModTool extends UIComponent {
  panelName = 'ModTool';
  panelHeight = 2000;
  panelWidth = 500;
  
  initializeUI() {
    return View({
      children: textNodes,
      style: {backgroundColor: 'black'},
    });
  }
}

UIComponent.register(ModTool);