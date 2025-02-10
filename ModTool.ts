// Created by TechGryphon

// Attach this to a CustomUI Gizmo

// Enter your name below
const worldOwner = 'TechGryphon';

// Variables required
// Group Name: ModPanel_Core
// Variables as numbers: Role,
const managerLevel = 50;
const roles: { [key: string]: { name: string; color: string } }  = {
  '100': {
    name: 'Owner',
    color: 'blue',
  },
  '50': {
    name: 'Manager',
    color: 'green',
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
type ActivePlayer = {
  name: string;
  index: number;
}

interface MenuItem {
  label: string;
  onClick: () => void;
  color: string;
}

function CoreKey(variableName: string) {
  return 'ModPanel_Core' + ':' + variableName;
}


class ModTool extends UIComponent {
  private menuPages: MenuItem[] = [
      {label: 'Back', onClick: ()=>{this.ShowPlayerList(); this.selectedPlayer = this.world.getServerPlayer()}, color: 'white'},
      {label: 'Player Management', onClick: () => {return}, color: 'purple'},
      {label: 'Teleport Options', onClick: () => {return}, color: 'green'},
      {label: 'Voice Settings', onClick: () => {return}, color: 'yellow'},
      {label: 'Kick Options', onClick: () => {return}, color: 'orange'},
      {label: 'Player Movement', onClick: () => {return}, color: 'teal'},
      {label: 'World Settings', onClick: () => {return}, color: 'blue'},
      {label: 'Stats', onClick: () => {return}, color: 'limegreen'}
  ]
  // private pages: String[] = ['PlayerList', 'MenuOptions', 'WorldSettings', 'PlayerManagement', 'PlayerRoles', 'PlayerPermissions', 'PlayerRoomsAccess', 'VoiceSettings', 'TeleportOptions', 'KickOptions', 'PlayerMovement', 'Stats'];
  private currentPage = 'PlayerList'
  private playerList: Player[] = new Array<Player>();
  private selectedPlayer: Player | undefined = undefined;
  private header1 = Text({text: 'Mod Panel', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private header2 = Text({text: 'Created by TechGryphon', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private header3 = Text({text: ' ', style: {fontSize:24, color: 'yellow', textAlign: 'center'}})
  private errorDisplay = Text({text: ' ', style: {fontSize:24, color: 'red', textAlign: 'center'}})
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
  displayPressableListBinding = new Binding<UINode[]>([]);
  CreatePlayerList(){
    let tempList: UINode[] = [];
    this.playerList.forEach((player: Player) => {
      tempList.push(Pressable({
        children: Text({text: player.name.get(), style: {color: this.ResolvePlayerColor(player), fontSize: 24, textAlign: 'center'}}),
        onClick: ()=>{
          console.log(player.name.get() + " selected");
          this.selectedPlayer = player;
          this.ShowMenuOptions();
        }
        }));
    })
    this.displayPressableListBinding.set(tempList);
  }



  panelName = 'ModTool';
  panelHeight = 1100;
  panelWidth = 500;
  start() {
    this.playerList.push(...this.world.getPlayers());
    this.selectedPlayer = this.world.getServerPlayer();
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
    // Update the displayed list of players if it is currently being accessed
    if (this.currentPage == 'PlayerList') {
      this.ShowPlayerList()
    }


  }
  PlayerExitWorld(player: Player) {
    console.log(player.name.get() + " exited world")
    if (this.playerList.find((p:Player)=>p.name.get() == player.name.get())){
      this.playerList.splice(this.playerList.indexOf(<Player>this.playerList.find((p: Player) => p.name.get() == player.name.get())),1)
    }
    // Update the displayed list of players if it is currently being accessed
    if (this.currentPage == 'PlayerList') {
      this.ShowPlayerList()
    }

  }
  ShowPlayerList(){
    if (this.playerList.length === 0) {
      this.displayPressableListBinding.set(this.noPlayersText);
    }else {
      this.CreatePlayerList();
    }
  }
  ShowMenuOptions(){
    this.currentPage = 'MenuOptions';
    let tempList: UINode[] = [];
    this.menuPages.forEach((page: MenuItem) => {
      // TODO check the player level here
      if (50 < managerLevel && page.label == 'Player Management') return;
      tempList.push(Pressable({
        children: Text({text: page.label, style: {color: page.color, fontSize: 24, textAlign: 'center'}}),
        onClick: page.onClick
      }));
    })
    this.displayPressableListBinding.set(tempList);
  }

  initializeUI() {

    return View({

      children:[this.header1, this.header2, this.header3, this.errorDisplay,DynamicList({data: this.displayPressableListBinding, renderItem : (pressableItem: UINode)=> {
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