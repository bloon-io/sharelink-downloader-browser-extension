async function main() {
    const shareId = window.location.pathname.split('/').pop();
    console.log("shareId:", shareId);

    const manager = new BSDBE_RemoteTreeDataManager(shareId);
    const treeData = await manager.retrieveCurrentRemoteTreeData()
    console.log(treeData);
};

// --------------------------------------------------
main();
