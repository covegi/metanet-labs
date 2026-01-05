interface Constants {
    storageUrl: string,
    storageUrls: string[]
}

const storageProdUrl = "https://nanostore.babbage.systems"
const storageStagingUrl = "https://staging-nanostore.babbage.systems"
const storageLocalUrl = "http://localhost:3104"

const storageUrls = [storageProdUrl, storageStagingUrl, storageLocalUrl]

let constants: Constants

if (window.location.host.startsWith("local")) {
    constants = {
        storageUrl: storageLocalUrl,
        storageUrls: storageUrls
    }
} else if (
    window.location.host.startsWith("staging") || 
    import.meta.env.MODE === "development" 
) {
    constants = {
        storageUrl: storageStagingUrl,
        storageUrls: storageUrls
    }
} else {
    constants = {
        storageUrl: storageProdUrl,
        storageUrls: storageUrls
    }
} 

export default constants