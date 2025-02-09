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
  private playerList: Player[] = [];
  private selectedPlayer: Player | undefined;
  private header1 = Text({text: 'Mod Panel', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private header2 = Text({text: 'Created by TechGryphon', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private header3 = Text({text: ' ', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private header4 = Text({text: ' ', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  SetError(error: String){
    // TODO set this up later to display errors
    return
  }

  ResolvePlayerColor(player:Player){
    const worldValues = this.world.persistentStorage
    const playerModValue:number = worldValues.getPlayerVariable(player,CoreKey('Role'));
    return roles[String(playerModValue)].color;
  }
  private noPlayersText = [Text({text: 'No Players', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})]

  private pressableList:UINode[] = [];
  displayPressableListBinding = new Binding<UINode[]>(this.pressableList);
  CreatePressableList(){
    this.pressableList = [];
    this.playerList.forEach((player: Player) => {
      this.pressableList.push(Pressable({
        children: Text({text: player.name.get(), style: {color: this.ResolvePlayerColor(player), fontSize: 24, textAlign: 'center'}}),
        onClick: ()=>{
          this.selectedPlayer = player;
          //TODO Call the options menu
        }
        }));
    })
    // this.displayPressableListBinding.set(this.pressableList);
  }








  panelName = 'ModTool';
  panelHeight = 1100;
  panelWidth = 500;
  start() {
    this.playerList.push(...this.world.getPlayers())
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
  }
  PlayerEnterWorld(player: Player) {
    console.log(player.name.get() + " entered world")
    if (!this.playerList.find((p:Player)=>p.name.get() == player.name.get())){
      this.playerList.push(player)
    }
    if (this.currentPage == 'PlayerList') {
      this.ShowPlayerList()
    }

  }
  PlayerExitWorld(player: Player) {
    console.log(player.name.get() + " exited world")
    if (this.playerList.find((p:Player)=>p.name.get() == player.name.get())){
      this.playerList.splice(this.playerList.indexOf(<Player>this.playerList.find((p: Player) => p.name.get() == player.name.get())),1)
    }
    if (this.currentPage == 'PlayerList') {
      this.ShowPlayerList()
    }

  }
  ShowPlayerList(){
    if (this.playerList.length === 0) {
      this.displayPressableListBinding.set(this.noPlayersText);
    }else {
      this.CreatePressableList();
      this.displayPressableListBinding.set(this.pressableList);
    }
  }
  // ShowPlayerMenu(){
  //   // TODO make this show the actual menu
  //   // validate that a player is selected
  //   if (this.selectedPlayer.index !== -1) {
  //     //validate that the user has not been replaced by another player
  //     if (this.world.getPlayerFromIndex(this.selectedPlayer.index)?.name.get() != this.selectedPlayer.name) {
  //       console.log("Player has been replaced")
  //     }else {
  //       console.log(this.selectedPlayer.name + " has been selected")
  //     }
  //   }
  // }
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