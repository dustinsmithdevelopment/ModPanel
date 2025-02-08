// Created by TechGryphon

// Attach this to a CustomUI Gizmo

// Enter your name below
const worldOwner = 'TechGryphon';

// Variables required
// Group Name: ModPanel_Core
// Variables as numbers: Role,

///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

import 'horizon/core';

import {UIComponent, View, Text, UINode, Binding, Callback, Pressable, DynamicList} from 'horizon/ui';
import {Component, CodeBlockEvents, Player, World} from "horizon/core";
type PlayerDisplayValues = { // Horizon Player object
  name: string;    // Current local id
  displayColor: string; // display color for player

};

type MyButtonProps = {
  label: Binding<String>,
  onClick: Callback,
};
const roles: { [key: string]: { name: string; color: string } }  = {
  '100': {
    name: 'Admin',
    color: 'blue',
  },
  '10': {
    name: 'Mod',
    color: 'green',
  },
  '0': {
    name: 'Player',
    color: 'white',
  },
  '-1': {
    name: 'Banned',
    color: 'red',
  }
}

function CoreKey(variableName: string) {
  return 'ModPanel_Core' + ':' + variableName;
}
class ModTool extends UIComponent {

  private header1 = Text({text: 'Mod Panel', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private header2 = Text({text: 'Created by TechGryphon', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private header3 = Text({text: ' ', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})




  ModButton(props: MyButtonProps): UINode {
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
  private NullDisplayValues: PlayerDisplayValues[] = [{ name: 'No Players Found', displayColor: 'orange' }];
  private playerDisplayValues: PlayerDisplayValues[] = [...this.NullDisplayValues];
  private displayListBinding = new Binding<PlayerDisplayValues[]>(this.playerDisplayValues);

  UpdateDisplayValues() {
    this.playerDisplayValues = [];
    const worldValues = this.world.persistentStorage
    this.world.getPlayers().forEach((player: Player) => {
      const tempName = player.name.get();
      const playerModValue:number = worldValues.getPlayerVariable(player,CoreKey('Role'));
      const playerColor = roles[String(playerModValue)].color;
      this.playerDisplayValues.push({name: tempName, displayColor: playerColor});
    })
    if (this.playerDisplayValues.length === 0) {
      this.displayListBinding.set(this.NullDisplayValues);
    }else {
      this.displayListBinding.set(this.playerDisplayValues);
    }
  }








  panelName = 'ModTool';
  panelHeight = 1100;
  panelWidth = 500;
  start() {
    this.connectCodeBlockEvent(
        this.entity,
        CodeBlockEvents.OnPlayerEnterWorld,
        (player:Player)=> {
          console.log(player.name.get() + " entered world")
          this.UpdateDisplayValues()
        }
    );
    this.connectCodeBlockEvent(
        this.entity,
        CodeBlockEvents.OnPlayerExitWorld,
        (player:Player)=> {
          console.log(player.name.get() + " exited world")
          this.UpdateDisplayValues()
          return
        }
    )
  }


  initializeUI() {

    return View({

      children:[this.header1, this.header2, this.header3,DynamicList({data: this.displayListBinding, renderItem : (player: PlayerDisplayValues)=> {
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