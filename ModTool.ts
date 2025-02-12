// Created by TechGryphon

// Attach this to a CustomUI Gizmo

// Enter your name below
const worldOwner = 'TechGryphon';
const preferredFontSize = 24;
const calculatedPanelHeight = preferredFontSize * 40;
const roles: { [key: string]: RoleData } = {
  '100': { name: 'Owner', color: 'blue' },
  '50': { name: 'Manager', color: 'green' },
  '10': { name: 'Moderator', color: 'green' },
  '0': { name: 'Player', color: 'white' },
};

// Variables required
// Group Name: ModPanel_Core
// Variables as numbers: Role, Rooms, Permissions
const managerLevel = 50;
interface RoleData {
  name: string;
  color: string;
}

interface RoleValue {
  name: string;
  roleLevelValue: number;
}

function getRoles(roles: { [key: string]: RoleData }): RoleValue[] {
  return Object.entries(roles)
      // Filter out the role with name 'Owner'
      .filter(([_, role]) => role.name !== 'Owner')
      // Sort entries by the key (converted to a number) in descending order
      .sort(([aKey], [bKey]) => Number(bKey) - Number(aKey))
      // Map to the desired format
      .map(([key, role]) => ({
        name: role.name,
        roleLevelValue: Number(key),
      }));
}



const roleValues = getRoles(roles);
// @ts-ignore
const managerRoleValue = roleValues.find(role => role.name === 'Manager').roleLevelValue;


///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

import 'horizon/core';

import {UIComponent, View, Text, UINode, Binding, Callback, Pressable, DynamicList, PressableProps} from 'horizon/ui';
import {Component, CodeBlockEvents, Player, World} from "horizon/core";

interface MenuItem {
  label: string;
  onClick: (modPlayer:Player, targetPlayer:Player) => void;
  color: string;
}

function CoreKey(variableName: string) {
  return 'ModPanel_Core' + ':' + variableName;
}


class ModTool extends UIComponent {
  private teleportLocations = [
    'Respawn', 'VIP', 'Jail', 'Office', 'Stage', 'Bar', 'Room1', 'Room2'
  ];
  private restrictedTeleportLocations = [...this.teleportLocations].filter(location => location !== 'Respawn' && location !== 'Jail');
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

  private controlledMenuPages:String[] = ['Teleport Options', 'Voice Settings', 'Kick Options', 'Player Movement', 'World Settings']
  private mainMenuPages: MenuItem[] = [
      {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        this.ShowPlayerList();
        }, color: 'white'},
      {label: 'Player Management', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.ShowPlayerManagementMenuOptions(modPlayer, targetPlayer);
        }, color: 'purple'},
      {label: 'Teleport Options', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.ShowTeleportOptionsMenuOptions(modPlayer, targetPlayer);
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
  private playerManagementMenuPages: MenuItem[] = [
    {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        this.ShowMainMenuOptions(modPlayer, targetPlayer);
      }, color: 'white'},
    {label: 'Player Roles', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.ShowPlayerRolesMenuOptions(modPlayer, targetPlayer);
      }, color: 'purple'},
    {label: 'Player Permissions', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.ShowPlayerPermissions(modPlayer, targetPlayer);
      }, color: 'purple'},
    {label: 'Player Rooms Access', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.ShowPlayerRoomsAccess(modPlayer, targetPlayer);
      }, color: 'purple'}
  ]

  private teleportOptionsMenuPages: MenuItem[] = [
    {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        this.ShowMainMenuOptions(modPlayer, targetPlayer);
      }, color: 'white'},
  ]
  BuildTeleportPages(){
    this.teleportLocations.forEach((location: string) => {

      this.teleportOptionsMenuPages.push({label: location, onClick: (modPlayer:Player, targetPlayer:Player) => {
          console.log(modPlayer.name.get() + " selected Teleport:" + location + " on " + targetPlayer.name.get());
          if (this.restrictedTeleportLocations.includes(location)) {
            let hasAccess = false;
            const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
            const modAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Rooms')).toString();
            const modAccessValue = modAccess[this.restrictedTeleportLocations.indexOf(location)];
            console.log(String(modAccessValue) + " is the value of " + location + " in the mod's access list");
            if (modLevel >= managerLevel) hasAccess = true;
            if (modAccessValue == '9') hasAccess = true;

            if (hasAccess){
              this.TeleportPlayer(targetPlayer, location);
              this.errorText.set(' ');
            }else {
              this.errorText.set('You do not have permission to teleport to ' + location);}
          }else {
            // location is not restricted
            this.TeleportPlayer(targetPlayer, location);
            this.errorText.set(' ');
          }
        }, color: 'green'});
    })
  }

  TeleportPlayer(targetPlayer:Player, location:string){
    //TODO this needs to be written
    console.log(targetPlayer.name.get() + " teleported to " + location);
  }
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
          this.ShowMainMenuOptions(modPlayer, targetPlayer);
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
    this.BuildTeleportPages();
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
    const persistentStorageValues = this.world.persistentStorage;
    const userRooms = persistentStorageValues.getPlayerVariable(player, CoreKey('Rooms'));
    if (userRooms == 0) {
      const defaultRoomValue = Number('1'.repeat(this.restrictedTeleportLocations.length));
      this.world.persistentStorage.setPlayerVariable(player, CoreKey('Rooms'), defaultRoomValue);
    }
    const userPermissions = persistentStorageValues.getPlayerVariable(player, CoreKey('Permissions'));
    if (userPermissions == 0) {
      const defaultPermissionValue = Number('1'.repeat(this.controlledMenuPages.length));
      this.world.persistentStorage.setPlayerVariable(player, CoreKey('Permissions'), defaultPermissionValue);
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
  BuildMenu(modPlayer:Player, targetPlayer: Player, menuOptions: MenuItem[]) {
    let tempList: UINode[] = [];
    menuOptions.forEach((page: MenuItem) => {
      tempList.push(Pressable({
        children: Text({text: page.label, style: {color: page.color, fontSize: preferredFontSize, textAlign: 'center'}}),
        onClick: (player:Player) => {page.onClick(player, targetPlayer)}
      }));
    })
    this.displayPressableListBinding.set(tempList);
  }

  ShowMainMenuOptions(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'MenuOptions';
    let tempList: UINode[] = [];
    const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
    const modPermissions = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString();
    this.mainMenuPages.forEach((page: MenuItem) => {
      // TODO check the player level here
      if (modLevel < managerLevel && page.label == 'Player Management') return;
      if (this.controlledMenuPages.includes(page.label) && modLevel < managerLevel) {
        const pageAccessValue = modPermissions[this.controlledMenuPages.indexOf(page.label)];
        if (!(pageAccessValue == '9')) return;
      }
      tempList.push(Pressable({
        children: Text({text: page.label, style: {color: page.color, fontSize: preferredFontSize, textAlign: 'center'}}),
        onClick: (player:Player) => {page.onClick(player, targetPlayer)}
      }));
    })
    this.displayPressableListBinding.set(tempList);
  }
  ShowPlayerManagementMenuOptions(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'PlayerManagement';
    this.errorText.set(' ');
    this.BuildMenu(modPlayer, targetPlayer, this.playerManagementMenuPages);
  }
  ShowTeleportOptionsMenuOptions(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'TeleportOptions';
    this.BuildMenu(modPlayer, targetPlayer, this.teleportOptionsMenuPages);
  }
  ShowPlayerRolesMenuOptions(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'PlayerRoles';
    let tempList: UINode[] = [Pressable({
      children: Text({text: 'Back', style: {color: 'white', fontSize: preferredFontSize, textAlign: 'center'}}),
      onClick: (player:Player) => {this.ShowPlayerManagementMenuOptions(player, targetPlayer)}
    })];
    roleValues.forEach((role: RoleValue) => {
      const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
      const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
      let tempColor = 'red'
      if (targetLevel >= role.roleLevelValue) tempColor = 'green';
      tempList.push(Pressable({
        children: Text({text: role.name, style: {color: 'white', fontSize: preferredFontSize, textAlign: 'center', backgroundColor: tempColor}}),
        onClick: (player:Player) => {
          if (modLevel > role.roleLevelValue && modLevel > targetLevel) {
            if (role.name == 'Manager') this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Rooms'), Number('9'.repeat(this.restrictedTeleportLocations.length)));
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Role'), role.roleLevelValue);
            this.errorText.set(' ');
          }else {
            if (modLevel < role.roleLevelValue) this.errorText.set('You do not have permission assign this role.');
            if (modLevel <= targetLevel) this.errorText.set('You do not have permission to change this player\'s role.');
          }
          this.ShowPlayerRolesMenuOptions(player, targetPlayer);
        }
      }));
    })
    this.displayPressableListBinding.set(tempList);

  }
  ShowPlayerRoomsAccess(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'PlayerRoomsAccess';
    let tempList: UINode[] = [
        Pressable({
      children: Text({text: 'Back', style: {color: 'white', fontSize: preferredFontSize, textAlign: 'center'}}),
      onClick: (player:Player) => {this.ShowPlayerManagementMenuOptions(player, targetPlayer)}
    }),
      Pressable({
        children: Text({text: 'Add all rooms', style: {color: 'white', fontSize: preferredFontSize, textAlign: 'center'}}),
        onClick: (player:Player) => {
          const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
          const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
          if (modLevel > targetLevel) {
            let newAccess = Number('9'.repeat(this.restrictedTeleportLocations.length));
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Rooms'), newAccess);
            this.errorText.set(' ');
            this.ShowPlayerRoomsAccess(player, targetPlayer);
          }else {
            this.errorText.set('You do not have permission to change this player\'s access.');
          }
        }
      }),
      Pressable({
        children: Text({text: 'Remove all rooms', style: {color: 'white', fontSize: preferredFontSize, textAlign: 'center'}}),
        onClick: (player:Player) => {
          const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
          const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
          if (modLevel > targetLevel) {
            let newAccess = Number('1'.repeat(this.restrictedTeleportLocations.length));
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Rooms'), newAccess);
            this.errorText.set(' ');
            this.ShowPlayerRoomsAccess(player, targetPlayer);
          }else {
            this.errorText.set('You do not have permission to change this player\'s access.');
          }
        }
      })];
    const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
    const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
    const roomsAccess = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Rooms')).toString();
    for (let i = 0; i < this.restrictedTeleportLocations.length; i++) {

      let tempColor = 'red'
      const hasAccess = roomsAccess[i] == '9';
      if (hasAccess) tempColor = 'green';
      tempList.push(Pressable({
        children: Text({text: this.restrictedTeleportLocations[i], style: {color: 'white', fontSize: preferredFontSize, textAlign: 'center', backgroundColor: tempColor}}),
        onClick: (player:Player) => {
          console.log(this.restrictedTeleportLocations[i] + " was clicked");
          if (modLevel > targetLevel) {
            console.log('Mod level is greater than target level')
            let newAccess = roomsAccess;
            if (hasAccess) {newAccess = newAccess.slice(0, i) + '1' + newAccess.slice(i + 1)}
            else {newAccess = newAccess.slice(0, i) + '1' + newAccess.slice(i + 1)}
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Rooms'), Number(newAccess));
            this.errorText.set(' ');
            this.ShowPlayerRoomsAccess(player, targetPlayer);
          }else {
            console.log('Mod level is less than target level')
            this.errorText.set('You do not have permission to change this player\'s access.');
          }
        }
      }));
    }
    this.displayPressableListBinding.set(tempList);
  }
  ShowPlayerPermissions(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'PlayerPermissions';
    let tempList: UINode[] = [
      Pressable({
        children: Text({text: 'Back', style: {color: 'white', fontSize: preferredFontSize, textAlign: 'center'}}),
        onClick: (player:Player) => {this.ShowPlayerManagementMenuOptions(player, targetPlayer)}
      }),
      Pressable({
        children: Text({text: 'Add all permissions', style: {color: 'white', fontSize: preferredFontSize, textAlign: 'center'}}),
        onClick: (player:Player) => {
          const modLevel = this.world.persistentStorage.getPlayerVariable(player, CoreKey('Role'));
          const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
          if (modLevel >= managerLevel && targetLevel < managerLevel) {
            let newPermissions = Number('9'.repeat(this.controlledMenuPages.length));
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Permissions'), newPermissions);
            this.errorText.set(' ');
            this.ShowPlayerPermissions(player, targetPlayer);
          }else {
            if (modLevel < managerLevel) this.errorText.set('Only Managers and owners can assign permissions.');
            if (targetLevel >= managerLevel) this.errorText.set('Permissions cannot be modified on managers and owners.');
          }
        }
      }),
      Pressable({
        children: Text({text: 'Remove all permissions', style: {color: 'white', fontSize: preferredFontSize, textAlign: 'center'}}),
        onClick: (player:Player) => {
          const modLevel = this.world.persistentStorage.getPlayerVariable(player, CoreKey('Role'));
          const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
          if (modLevel >= managerLevel && targetLevel < managerLevel) {
            let newPermissions = Number('1'.repeat(this.controlledMenuPages.length));
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Permissions'), newPermissions);
            this.errorText.set(' ');
            this.ShowPlayerPermissions(player, targetPlayer);
          }else {
            if (modLevel < managerLevel) this.errorText.set('Only Managers and owners can assign permissions.');
            if (targetLevel >= managerLevel) this.errorText.set('Permissions cannot be modified on managers and owners.');
          }
        }
      })];
    const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
    const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
    const playerPermissions = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Permissions')).toString();
    for (let i = 0; i < this.controlledMenuPages.length; i++) {

      let tempColor = 'red'
      const hasAccess = playerPermissions[i] == '9';
      if (hasAccess) tempColor = 'green';
      tempList.push(Pressable({
        children: Text({text: this.controlledMenuPages[i], style: {color: 'white', fontSize: preferredFontSize, textAlign: 'center', backgroundColor: tempColor}}),
        onClick: (player:Player) => {
          console.log(this.controlledMenuPages[i] + " was clicked");
          if (modLevel >= managerLevel && targetLevel < managerLevel) {
            let newPermissions = playerPermissions;
            if (hasAccess) {newPermissions = newPermissions.slice(0, i) + '1' + newPermissions.slice(i + 1)}
            else {newPermissions = newPermissions.slice(0, i) + '1' + newPermissions.slice(i + 1)}
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Permissions'), Number(newPermissions));
            this.errorText.set(' ');
            this.ShowPlayerPermissions(player, targetPlayer);
          }else {
            if (modLevel < managerLevel) this.errorText.set('Only Managers and owners can assign permissions.');
            if (targetLevel >= managerLevel) this.errorText.set('Permissions cannot be modified on managers and owners.');
          }
        }
      }));
    }
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