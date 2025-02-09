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

import {UIComponent, View, Text, UINode, Binding, Callback, Pressable, DynamicList, PressableProps} from 'horizon/ui';
import {Component, CodeBlockEvents, Player, World} from "horizon/core";

type PlayerClickableValues = {
  name: string;
  displayColor: string;
  index: number;
  function: Function;
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
}
type ActivePlayer = {
  name: string;
  index: number;
}
function CoreKey(variableName: string) {
  return 'ModPanel_Core' + ':' + variableName;
}
class ModTool extends UIComponent {
  private currentPage = 'PlayerList'
  private selectedPlayer: ActivePlayer = {index: -1, name: 'No Player Selected'};
  private header1 = Text({text: 'Mod Panel', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private header2 = Text({text: 'Created by TechGryphon', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private header3 = Text({text: ' ', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private header4 = Text({text: ' ', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private NullDisplayValues: PlayerClickableValues[] = [{ name: 'No Players Found', displayColor: 'orange', index:-1, function: ()=>{return}}];
  private playerDisplayValues: PlayerClickableValues[] = [...this.NullDisplayValues];
  private displayListBinding = new Binding<PlayerClickableValues[]>(this.playerDisplayValues);
  SetError(error: String){
    // TODO set this up later to display errors
    return
  }

  UpdatePlayerListClickableValues() {
    this.playerDisplayValues = [];
    const worldValues = this.world.persistentStorage
    this.world.getPlayers().forEach((player: Player) => {
      const tempName = player.name.get();
      const playerModValue:number = worldValues.getPlayerVariable(player,CoreKey('Role'));
      const playerColor = roles[String(playerModValue)].color;
      const playerIndex = player.index.get();
      this.playerDisplayValues.push({name: tempName, displayColor: playerColor, index: playerIndex, function: ()=>{
        //TODO fix this
        this.selectedPlayer = {index: playerIndex, name: tempName};
        this.ShowPlayerMenu();
        }});
    });
    if (this.currentPage === 'PlayerList') {
      this.ShowPlayerList();
    }
  }
  private pressableList:UINode[] = [];
  displayPressableListBinding = new Binding<UINode[]>(this.pressableList);
  CreatePressableList(){
    this.NullDisplayValues.forEach((player: PlayerClickableValues) => {
      this.pressableList.push(Pressable({
        children: Text({text: player.name, style: {color: player.displayColor, fontSize: 24, textAlign: 'center'}}),
        onClick: ()=>{player.function()}
        }));
    })
    this.displayPressableListBinding.set(this.pressableList);
  }








  panelName = 'ModTool';
  panelHeight = 1100;
  panelWidth = 500;
  start() {
    this.connectCodeBlockEvent(
        this.entity,
        CodeBlockEvents.OnPlayerEnterWorld,
        (player:Player)=> {
          this.PlayerEnterWorld(player)
        }
    );
    this.connectCodeBlockEvent(
        this.entity,
        CodeBlockEvents.OnPlayerExitWorld,
        (player:Player)=> {
          this.PlayerExitWorld(player)
        }
    )
    this.ShowPlayerList()

    // TODO get rid of this when finished testing
    this.CreatePressableList()
  }
  PlayerEnterWorld(player: Player) {
    console.log(player.name.get() + " entered world")
    this.UpdatePlayerListClickableValues()
  }
  PlayerExitWorld(player: Player) {
    console.log(player.name.get() + " exited world")
    this.UpdatePlayerListClickableValues()
  }
  ShowPlayerList(){
    if (this.playerDisplayValues.length === 0) {
      this.displayListBinding.set(this.NullDisplayValues);
    }else {
      this.displayListBinding.set(this.playerDisplayValues);
    }
  }
  ShowPlayerMenu(){
    // TODO make this show the actual menu
    // validate that a player is selected
    if (this.selectedPlayer.index !== -1) {
      //validate that the user has not been replaced by another player
      if (this.world.getPlayerFromIndex(this.selectedPlayer.index)?.name.get() != this.selectedPlayer.name) {
        console.log("Player has been replaced")
      }else {
        console.log(this.selectedPlayer.name + " has been selected")
      }
    }
  }
  initializeUI() {

    return View({

      children:[this.header1, this.header2, this.header3, this.header4,DynamicList({data: this.displayPressableListBinding, renderItem : (pressableItem: UINode)=> {
          return pressableItem;
        }, style: {width: 500,}})],
      style: {
        flexDirection: 'column',
        backgroundColor: 'black',
        width: 500,
        height: 1400,},
    });
  }
}
UIComponent.register(ModTool);