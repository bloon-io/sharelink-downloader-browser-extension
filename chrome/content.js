const shareId = window.location.pathname.split('/').pop();
console.log("shareId:", shareId);

const manager = new BSDCE_RemoteTreeDataManager(shareId);
manager.retrieveCurrentRemoteTreeData().then(() => {
    console.log(manager._treeData_remote_current);

}).catch(error => {
    console.error(error);

});
