export interface Config {
    githubAppWebEndpoint: string,
    teamyCloudWebAPIEndpoint: string;
    teamyCloudSignInFinishUrl: string;
}

const developmentConfig: Config = {
    githubAppWebEndpoint: 'http://localhost:9000/apps/github',
    teamyCloudWebAPIEndpoint: 'http://localhost:9011',
    teamyCloudSignInFinishUrl: 'http://localhost:3000/cloud/identity/sign-in-finish'
}

const stagingConfig: Config = {
    githubAppWebEndpoint: 'https://web-backend.staging.teamyapp.com/apps/github',
    teamyCloudWebAPIEndpoint: 'https://cloud.staging.teamyapp.com',
    teamyCloudSignInFinishUrl: 'https://staging.teamyapp.com/cloud/identity/sign-in-finish'
}

const productionConfig: Config = {
    githubAppWebEndpoint: 'https://web-backend.teamyapp.com/apps/github',
    teamyCloudWebAPIEndpoint: 'https://cloud.teamyapp.com',
    teamyCloudSignInFinishUrl: 'https://teamyapp.com/cloud/identity/sign-in-finish'
}

export function getConfig(): Config {
    switch (import.meta.env.VITE_ENVIRONMENT) {
        case 'development':
            return developmentConfig;
        case 'staging':
            return stagingConfig;
        case 'production':
            return productionConfig;
        default:
            return developmentConfig;
    }
}