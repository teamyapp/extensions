import {ThirdPartyAppClient} from '@teamyapp/ext';

export async function requestWithIdentity  (
    client: ThirdPartyAppClient,
    url: string,
    options?: {
        method: string;
        headers?: Record<string, string>;
        body?: string;
    },
) {
    return request(url, Object.assign(
        {
            headers: {
                Authorization: `Bearer ${client.getAccessToken()}`,
            },
        },
        options,
    ));
}

export async function request(
    url: string,
    options?: {
        method: string;
        headers?: Record<string, string>;
        body?: string;
    },
): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
        fetch(url, {
            method: options?.method,
            mode: 'cors',
            cache: 'no-cache',
            headers: options?.headers,
            redirect: 'follow',
            body: options?.body,
        })
            .then(async (response) => {
                if (response.status >= 400) {
                    throw new Error(`request failed: status=${response.status}`);
                } else {
                    resolve(await response.text());
                }
            })
            .catch((err) => {
                console.error(err);
                resolve(null);
            });
    });
}