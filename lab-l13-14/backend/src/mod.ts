import UHRPTopicManager from "./topic-managers/UHRPTopicManager.js";
import UHRPLookupServiceFactory from "./lookup-services/UHRPLookupServiceFactory.js";

export const tm_uhrp = UHRPTopicManager;

function initLookupService(db: any) {
    console.log("LARS requested Lookup Service. Initializing factory...");
    try {
        const service = UHRPLookupServiceFactory(db);
        return service;
    } catch (err) {
        console.error("Failed to initialize Lookup Service:", err);
        throw err;
    }
}

const UniversalExport: any = function(this: any, dbOrOptions: any) {
    if (this instanceof UniversalExport) {
        return new UHRPTopicManager();
    }
    return initLookupService(dbOrOptions);
};

export default UniversalExport;

export const serviceMetaData = {
    name: "UHRP overlay service",
    version: "1.0.0"
};

export type { UHRPRecord, UTXOReference } from "./types.js";