import 'horizon/core';

// TODO Track player entering and exiting the world


import {UIComponent, View, Text, UINode, Binding, Callback, Pressable, DynamicList, ColorValue} from 'horizon/ui';
import {Player} from "horizon/core";

const header1 = Text({text: 'Mod Panel', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
const header2 = Text({text: 'Created by TechGryphon', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
const header3 = Text({text: ' ', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})

type WatchedPlayer = { // Horizon Player object
  name: string;    // Current local id
  displayColor: string; // display color for player

};

type MyButtonProps = {
  label: Binding<String>,
  onClick: Callback,
};


function ModButton(props: MyButtonProps): UINode {
  return Pressable({
    children: Text({
      text: props.label,
      style: { fontSize:24, color: 'white', textAlign: 'center' },
    }),
    onClick: props.onClick,
    style: {
      backgroundColor: 'black',
      width: 500,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}


// create an array of text bindings to store text and allow update.
let tempTextBindings: Binding<String>[] = [];
for (let i = 0; i < 32; i++) {
  tempTextBindings.push(new Binding<String>(String(i+1)))
}
const textBindings = [...tempTextBindings];
tempTextBindings = [] as Binding<String>[];
function doNothing() {}

// create an array of UINodes to display mod tool text
let tempUINodeArray: UINode[] = [];
for (let i = 0; i < 32; i++) {
  tempUINodeArray.push(ModButton({label: textBindings[i], onClick: doNothing}));
}
const textNodes = [...tempUINodeArray];
tempUINodeArray = [] as UINode[];






const allPanelNodes: UINode[] = [header1, header2, header3, ...textNodes];


const players: WatchedPlayer[] = [{ name: 'No Players Found', displayColor: 'orange' }];
const displayListBinding = new Binding<WatchedPlayer[]>(players);
class ModTool extends UIComponent {
  panelName = 'ModTool';
  panelHeight = 1100;
  panelWidth = 500;
  
  initializeUI() {

    return View({

      children:[header1, header2, header3,DynamicList({data: displayListBinding, renderItem : (player: WatchedPlayer)=> {
          return Text({text: player.name, style: {color: player.displayColor, fontSize: 24, textAlign: 'center'}});
        }, style: {width: 500,}})],
      style: {
        flexDirection: 'column',
        backgroundColor: 'black',
        width: 500,
        height: 1100,},
    });
  }
}
UIComponent.register(ModTool);

// let activePlayerList = [{ name: 'Tech', displayColor: 'blue' }, { name: 'Gryphon', displayColor: 'red' }];
// displayListBinding.set(activePlayerList)