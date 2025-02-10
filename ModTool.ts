// Created by TechGryphon

// Attach this to a CustomUI Gizmo

// Enter your name below
const worldOwner = 'TechGryphon';
const preferredFontSize = 24;
const calculatedPanelHeight = preferredFontSize * 40;

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

interface MainMenuItem {
  label: string;
  onClick: (modPlayer:Player, targetPlayer:Player) => void;
  color: string;
}

function CoreKey(variableName: string) {
  return 'ModPanel_Core' + ':' + variableName;
}


class ModTool extends UIComponent {
  // private pages: String[] = ['PlayerList', 'MenuOptions', 'WorldSettings', 'PlayerManagement', 'PlayerRoles', 'PlayerPermissions', 'PlayerRoomsAccess', 'VoiceSettings', 'TeleportOptions', 'KickOptions', 'PlayerMovement', 'Stats'];
  private currentPage = 'PlayerList'
  private playerList: Player[] = new Array<Player>();
  private header1 = Text({text: 'Mod Panel', style: {fontSize:preferredFontSize, color: 'yellow', textAlign: 'center'}})
  private header2 = Text({text: 'Created by TechGryphon', style: {fontSize:preferredFontSize, color: 'yellow', textAlign: 'center'}})
  private headerGap = Text({text: ' ', style: {fontSize:preferredFontSize, color: 'yellow', textAlign: 'center'}})
  private targetPlayerNameText = new Binding<String>(' ');
  private playerNameDisplay = Text({text: this.targetPlayerNameText, style: {fontSize:preferredFontSize, color: 'green', textAlign: 'center'}})
  private errorText = new Binding<String>(' ');
  private errorDisplay = Text({text: this.errorText, style: {fontSize:preferredFontSize, color: 'red', textAlign: 'center'}})
  private noPlayersText = [Text({text: 'No Players', style: {fontSize:preferredFontSize, color: 'yellow', textAlign: 'center'}})]
  displayPressableListBinding = new Binding<UINode[]>([]);


  private mainMenuPages: MainMenuItem[] = [
      {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        this.ShowPlayerList();
        }, color: 'white'},
      {label: 'Player Management', onClick: (modPlayer:Player, targetPlayer:Player) => {
        console.log(modPlayer.name.get() + " selected Player Management on " + targetPlayer.name.get());
        }, color: 'purple'},
      {label: 'Teleport Options', onClick: (modPlayer:Player, targetPlayer:Player) => {
        console.log(modPlayer.name.get() + " selected Teleport Options on " + targetPlayer.name.get());
        }, color: 'green'},
      {label: 'Voice Settings', onClick: (modPlayer:Player, targetPlayer:Player) => {
        console.log(modPlayer.name.get() + " selected Voice Settings on " + targetPlayer.name.get());
        }, color: 'yellow'},
      {label: 'Kick Options', onClick: (modPlayer:Player, targetPlayer:Player) => {
        console.log(modPlayer.name.get() + " selected Kick Options on " + targetPlayer.name.get());
        }, color: 'orange'},
      {label: 'Player Movement', onClick: (modPlayer:Player, targetPlayer:Player) => {
        console.log(modPlayer.name.get() + " selected Player Movement on " + targetPlayer.name.get());
        }, color: 'teal'},
      {label: 'World Settings', onClick: (modPlayer:Player, targetPlayer:Player) => {
        console.log(modPlayer.name.get() + " selected World Settings on " + targetPlayer.name.get());
        }, color: 'blue'},
      {label: 'Stats', onClick: (modPlayer:Player, targetPlayer:Player) => {
        console.log(modPlayer.name.get() + " selected Stats on " + targetPlayer.name.get());
        }, color: 'limegreen'}
  ]

  ResolvePlayerColor(player:Player){
    const worldValues = this.world.persistentStorage
    const playerModValue:number = worldValues.getPlayerVariable(player,CoreKey('Role'));
    return roles[String(playerModValue)].color;
  }

  CreatePlayerList(){
    let tempList: UINode[] = [];
    this.playerList.forEach((targetPlayer: Player) => {
      tempList.push(Pressable({
        children: Text({text: targetPlayer.name.get(), style: {color: this.ResolvePlayerColor(targetPlayer), fontSize: preferredFontSize, textAlign: 'center'}}),
        onClick: (modPlayer:Player)=>{
          console.log(targetPlayer.name.get() + " selected by " + modPlayer.name.get());
          this.targetPlayerNameText.set('Selected: ' + targetPlayer.name.get());
          this.ShowMenuOptions(modPlayer, targetPlayer);
        }
        }));
    })
    this.displayPressableListBinding.set(tempList);
  }



  panelName = 'ModTool';
  panelHeight = calculatedPanelHeight;
  panelWidth = 500;
  start() {
    this.playerList.push(...this.world.getPlayers());
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
    this.currentPage = 'PlayerList';
    this.targetPlayerNameText.set(' ');
    this.errorText.set(' ');
    if (this.playerList.length === 0) {
      this.displayPressableListBinding.set(this.noPlayersText);
    }else {
      this.CreatePlayerList();
    }
  }
  ShowMenuOptions(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'MenuOptions';
    let tempList: UINode[] = [];
    this.mainMenuPages.forEach((page: MainMenuItem) => {
      // TODO check the player level here
      if (50 < managerLevel && page.label == 'Player Management') return;
      tempList.push(Pressable({
        children: Text({text: page.label, style: {color: page.color, fontSize: 24, textAlign: 'center'}}),
        onClick: (player:Player) => {page.onClick(player, targetPlayer)}
      }));
    })
    this.displayPressableListBinding.set(tempList);
  }

  initializeUI() {

    return View({

      children:[this.header1, this.header2, this.headerGap, this.playerNameDisplay, this.errorDisplay,DynamicList({data: this.displayPressableListBinding, renderItem : (pressableItem: UINode)=> {
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