class SharelinkDataManager {

    static IGNORE_CARD_TYPE = [3, 5, 11, 12, 13, 14];
    static BLOON_ADJ_API_WSS_URL = "wss://adj.bloon.io/Bloon_Adjutant/api";

    constructor(shareId) {
        this.SHARE_ID = shareId;
    }

    async isFolder() {
        const socket = new WebSocket(SharelinkDataManager.BLOON_ADJ_API_WSS_URL);
        try {
            await new Promise((resolve, reject) => {
                socket.onopen = resolve;
                socket.onerror = reject;
            });

            const api = new WssApiCaller(socket);
            let outData = await api.getShareInfo({ shareID: this.SHARE_ID });

            const shareData = outData.shareData;
            // const itemID = shareData.itemID;
            const isFolder = shareData.isFolder;
            // const bloonID = shareData.bloonID;

            return isFolder;

        } finally {
            socket.close();
        }
    }

    async retrieveCurrentRemoteTreeData() {

        // Tree data to return
        const treeData = {
            ctx: {
                sharelink_folder_name: null
            },
            folder_set: {},
            file_dict: {}
        };

        const socket = new WebSocket(SharelinkDataManager.BLOON_ADJ_API_WSS_URL);
        try {
            await new Promise((resolve, reject) => {
                socket.onopen = resolve;
                socket.onerror = reject;
            });

            const api = new WssApiCaller(socket);
            let outData = await api.getShareInfo({ shareID: this.SHARE_ID });

            const shareData = outData.shareData;
            const itemID = shareData.itemID;
            const isFolder = shareData.isFolder;
            const bloonID = shareData.bloonID;

            if (isFolder) {
                await this._getChildFolderRecursiveUnit(api, this.SHARE_ID, bloonID, [itemID], "", treeData);

            } else {
                // It will enter this block only if item itself of this sharelink is not a folder.
                console.warn("This sharelink is not a folder.");
            }

        } finally {
            socket.close();
        }

        return treeData;
    }

    async _getChildFolderRecursiveUnit(api, shareID, bloonID, folderIDs, localRelPath, treeData) {
        const retData = await api.getFoldersMin({ shareID, bloonID, folderIDs });
        const folderDatas = retData.folders;

        for (const folder of folderDatas) {
            const folderID = folder.folderID;
            const name = folder.name;
            const folderName = Utils.getAvailableFileBaseName(name, true);
            let childCards = [];
            let childRelPath = "";

            // means it is root
            if (!localRelPath) {
                treeData.ctx.sharelink_folder_name = name;
                childRelPath = folderName;

            } else {
                childRelPath = localRelPath + "/" + folderName;
                let index = 0;
                while (childRelPath in treeData.folder_set) {
                    console.log("folder path exist: " + childRelPath);
                    index += 1;
                    childRelPath = localRelPath + "/" + Utils.getFileName(folderName, '', index);
                    console.log("    change to: " + childRelPath);
                }
            }

            treeData.folder_set[childRelPath] = folderID;

            if (folder.childCardIDs.length > 0) {
                const retData = await api.getCardsMin({ shareID, bloonID, cardIDs: folder.childCardIDs });
                childCards = retData.cards;
            }

            this._handle_childFiles(childRelPath, childCards, treeData);

            if (folder.childFolderIDs.length > 0) {
                await this._getChildFolderRecursiveUnit(api, shareID, bloonID, folder.childFolderIDs, childRelPath, treeData);
            }
        }
    }

    _handle_childFiles(localRelPath, childCards, treeData) {
        for (const childCard of childCards) {
            if (SharelinkDataManager.IGNORE_CARD_TYPE.includes(childCard.typeInt)) {
                console.log("Ignore Non-File Card with type: " + childCard.typeInt + "; name: " + childCard.name);
                continue;
            }
            const chC_id = childCard.cardID;
            const chC_extension = childCard.extension;
            const chC_name = Utils.getAvailableFileBaseName(childCard.name, !chC_extension);
            const chC_version = childCard.version;  // int
            const chC_checksum_b64str = childCard.checksum;  // binary in base64 format string
            const chC_checksum_str = atob(chC_checksum_b64str);

            let index = 0;
            let chC_localRelPath = localRelPath + "/" + Utils.getFileName(chC_name, chC_extension, index);
            while (chC_localRelPath in treeData.file_dict) {
                console.log("file path exist: " + chC_localRelPath);
                index++;
                chC_localRelPath = localRelPath + "/" + Utils.getFileName(chC_name, chC_extension, index);
                console.log("    change to: " + chC_localRelPath);
            }

            treeData.file_dict[chC_localRelPath] = [chC_version, chC_checksum_str, chC_id];
        }
    }
}

class WssApiCaller {
    constructor(socket) {
        this.socket = socket;
    }

    async getFoldersMin(params) {
        return await this._wssCall("getFoldersMin", params);
    }

    async getCardsMin(params) {
        return await this._wssCall("getCardsMin", params);
    }

    async getShareInfo(params) {
        return await this._wssCall("getShareInfo", params);
    }

    async _wssCall(funcName, params) {
        params.token = null;
        const inData = {
            func_name: funcName,
            cbID: "",
            params: params
        };

        const resStr = await new Promise((resolve, reject) => {
            this.socket.onmessage = (event) => {
                resolve(event.data);
            };

            this.socket.onerror = (error) => {
                reject(new Error('WssApiCaller onerror: ' + error.message));
            };

            this.socket.send(JSON.stringify(inData));
        });

        const outData = JSON.parse(resStr);
        if (outData && outData.output_state && outData.data) {
            if (outData.output_state === "OK") {
                return outData.data;
            } else if (outData) {
                throw new Error(outData.data.err_code);
            }
        }
        throw new Error('UNKNOWN_ERR');
    }
}

class Utils {
    static getAvailableFileBaseName(baseName, isEmptyExt) {
        let fileName = baseName.replace(/[\\/:*?"<>|]/g, '_').trim();
        if (fileName.toLowerCase() === "con") {
            // Windows limitation, file name cannot be 'con'
            fileName += '_';
        }
        if (isEmptyExt && fileName.endsWith('.')) {
            fileName = fileName.replace(/\.+$/, '_');
        }
        return fileName;
    }

    static getFileName(baseName, extension, index) {
        const dotExtension = extension ? '.' + extension : '';
        return index === 0 ? baseName + dotExtension : baseName + ' (' + index + ')' + dotExtension;
    }
}
