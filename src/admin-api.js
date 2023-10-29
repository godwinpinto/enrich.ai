/**
 * This admin module handles interactions with the Forge API and Octokit for managing app secrets and git projects.
 */

import api, { route, fetch, storage, startsWith } from '@forge/api';
import { Octokit } from '@octokit/rest';
import Resolver from '@forge/resolver';

const resolver = new Resolver();

/**
 * Masks a string by replacing all characters except the first three and last two with asterisks.
 */
const maskString = (inputString) => {
    if (inputString.length < 5) {
        return inputString;
    }
    const firstThree = inputString.slice(0, 3);
    const lastTwo = inputString.slice(-2);
    const middleMasked = "*".repeat(inputString.length - 5);
    return firstThree + middleMasked + lastTwo;
}

/**
 * Retrieves app secrets, masks sensitive information, and returns them.
 */
resolver.define('get-app-secrets', async (req) => {
    const APP_KEYS = await storage.getSecret('APP_KEYS')
    if (APP_KEYS) {
        return {
            status: 'ok',
            keys: {
                makerSuite: maskString(APP_KEYS.makerSuite),
                githubToken: maskString(APP_KEYS.githubToken),
                repoOwner: APP_KEYS.repoOwner,
                repoType: APP_KEYS.repoType
            }
        }
    } else {
        return {
            status: 'unavailable'
        };
    }
});

/**
 * Sets app secrets in storage and returns the masked keys.
 */
resolver.define('set-app-secrets', async (req) => {
    const { makerSuite, githubToken, repoOwner, repoType } = req.payload;
    const keys = {
        makerSuite,
        githubToken,
        repoOwner,
        repoType
    }
    await storage.setSecret('APP_KEYS', keys)

    return {
        status: 'ok',
        keys: {
            makerSuite: maskString(makerSuite),
            githubToken: maskString(githubToken),
            repoOwner,
            repoType
        }
    }
});

/**
 * Deletes app secrets from storage.
 */
resolver.define('delete-app-secrets', async (req) => {
    await storage.deleteSecret('APP_KEYS')
    return {
        status: 'ok',
        keys: {
            makerSuite: '',
            githubToken: '',
            repoOwner: '',
            repoType: ''
        }
    }
});

/**
 * Retrieves git projects using app secrets and Forge API.
 */
resolver.define('get-git-projects', async (req) => {
    const APP_KEYS = await storage.getSecret('APP_KEYS')
    if (!APP_KEYS) {
        return {
            status: 'unavailable'
        };
    }
    try {
        const octokit = new Octokit({
            auth: APP_KEYS.githubToken,
            request: {
                fetch: fetch
            }
        });

        const response = await (APP_KEYS.repoType == 'O' ?
            octokit.repos.listForOrg({ username: APP_KEYS.repoOwner }) :
            octokit.repos.listForUser({ username: APP_KEYS.repoOwner })
        );

        const respositories = response.data.map(repo => {
            return {
                name: repo.name,
                html_url: repo.html_url,
                description: repo.description
            }
        })

        const mappingList = await getMappedProjectsAndRepo();
        const resultMap = new Map(mappingList.map(item => [item.key, item.value]));
        const forgeResponse = await api.asApp().requestJira(route`/rest/api/3/project`);
        const projects = (await forgeResponse.json()).map((project, index) => {
            return {
                id: project.id,
                key: project.key,
                name: project.name,
                repos: resultMap.get('PROJECT_REPO_' + project.id) ? resultMap.get('PROJECT_REPO_' + project.id) : []
            }
        })
        return {
            status: 'ok',
            repositories: respositories,
            projects: projects
        }
    } catch (error) {
        console.log('get-git-projects',error)
        return {
            status: 'unavailable'
        }
    }
});

/**
 * Retrieves a list of mapped projects and their associated repositories.
 * @returns {Array} An array of project-repo mappings.
 */
const getMappedProjectsAndRepo = async () => {
    let allResults = [];
    let cursor = null;
    do {
        const mappingList = await storage.query()
            .where('key', startsWith('PROJECT_REPO_'))
            .limit(20)
            .cursor(cursor)
            .getMany();
        const { results, nextCursor } = mappingList;
        allResults = allResults.concat(results);
        cursor = nextCursor;
    } while (cursor);

    return allResults;
};

/**
 * Updates the mapping of repositories to a project.
 */
resolver.define('update-project-repo-mapping', async (req) => {
    const { projectId, repo } = req.payload;
    try {
        if (repo.length == 0) {
            await storage.delete('PROJECT_REPO_' + projectId)
        } else {
            await storage.set('PROJECT_REPO_' + projectId, repo)
        }
        return {
            status: 'ok'
        }
    } catch (error) {
        console.log(error)
        return {
            status: 'unavailable'
        }
    }
});

/**
 * Export the resolver handler.
 */
export const handler = resolver.getDefinitions();
