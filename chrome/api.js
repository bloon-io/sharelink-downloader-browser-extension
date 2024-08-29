window.BSDCE_Utils = class Utils {
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
        if (index === 0) {
            return baseName + extension;
        }
        return baseName + ' (' + index + ')' + extension;
    }
}

window.BSDCE_RemoteTreeDataManager = class RemoteTreeDataManager {

    static IGNORE_CARD_TYPE = [3, 5, 11, 12, 13, 14];

    constructor(shareId) {
        this.SHARE_ID = shareId;
        this.BLOON_ADJ_API_WSS_URL = "wss://adj.bloon.io/Bloon_Adjutant/api";
        this._treeData_remote_current = null;
    }

    async retrieveCurrentRemoteTreeData() {
        const treeData = {
            ctx: {
                sharelink_folder_name: null
            },
            folder_set: {},
            file_dict: {}
        };

        const socket = new WebSocket(this.BLOON_ADJ_API_WSS_URL);
        try {
            await new Promise((resolve, reject) => {
                socket.onopen = resolve;
                socket.onerror = reject;
            });

            const api = new BSDCE_WssApiCaller(socket);

            let outData = await api.getShareInfo({ shareID: this.SHARE_ID });
            // let version = outData.version;
            // console.log("sharelink version: " + version);

            const shareData = outData.shareData;
            const itemID = shareData.itemID;
            const isFolder = shareData.isFolder;
            const bloonID = shareData.bloonID;

            if (isFolder) {
                await this._getChildFolderRecursiveUnit(api, this.SHARE_ID, bloonID, [itemID], "", treeData);
            } else {
                // TODO to handle
                console.info("This sharelink is not a folder.");
            }

            this._treeData_remote_current = treeData;

        } finally {
            socket.close();

        }
    }

    async _getChildFolderRecursiveUnit(api, shareID, bloonID, folderIDs, localRelPath, treeData) {
        const retData = await api.getFoldersMin({ shareID, bloonID, folderIDs });
        const folderDatas = retData.folders;

        for (const folder of folderDatas) {
            const folderID = folder.folderID;
            const name = folder.name;
            const folderName = BSDCE_Utils.getAvailableFileBaseName(name, true);
            let childCards = [];
            let childRelPath = "";

            if (!localRelPath) {
                // mean it is root
                treeData.ctx.sharelink_folder_name = name;
                childRelPath = folderName;
            } else {
                childRelPath = localRelPath + "/" + folderName;
                let index = 0;
                while (childRelPath in treeData.folder_set) {
                    console.debug("folder path exist : " + childRelPath);
                    index += 1;
                    childRelPath = localRelPath + "/" + BSDCE_Utils.getFileName(folderName, '', index);
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
            if (RemoteTreeDataManager.IGNORE_CARD_TYPE.includes(childCard.typeInt)) {
                console.debug("Ignore Non-File Card...");
                continue;
            }
            const chC_id = childCard.cardID;
            const chC_extension = childCard.extension;
            const chC_name = BSDCE_Utils.getAvailableFileBaseName(childCard.name, !chC_extension);
            const chC_version = childCard.version;  // int
            const chC_checksum_b64str = childCard.checksum;  // binary in base64 format string
            const chC_checksum_str = atob(chC_checksum_b64str);

            let index = 0;
            let chC_localRelPath = localRelPath + "/" + BSDCE_Utils.getFileName(chC_name, chC_extension, index);
            while (chC_localRelPath in treeData.file_dict) {
                console.debug("file path exist : " + chC_localRelPath);
                index++;
                chC_localRelPath = localRelPath + "/" + BSDCE_Utils.getFileName(chC_name, chC_extension, index);
            }

            treeData.file_dict[chC_localRelPath] = [chC_version, chC_checksum_str, chC_id];
        }
    }
}

window.BSDCE_WssApiCaller = class WssApiCaller {
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
