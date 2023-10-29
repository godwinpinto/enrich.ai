/**
 * This user module handles interactions with the Forge API and Octokit for generating AI on code.
 */
import Resolver from '@forge/resolver';
import api, { route, fetch, storage } from '@forge/api';
import { Octokit } from '@octokit/rest';

const resolver = new Resolver();

/**
 * Retrieves configuration based on the provided projectId.
 * @param {string} projectId - The ID of the project.
 * @returns {Object} Configuration object.
 */

const getConfig = async (projectId) => {
  const APP_KEYS = await storage.getSecret('APP_KEYS')
  if (!APP_KEYS) {
    return {
      octokit: null,
      makerSuiteApiKey: null,
      owner: null,
      repos: []
    }
  }
  const octokit = new Octokit({
    auth: APP_KEYS.githubToken,
    request: {
      fetch: fetch
    }
  });

  const repos = projectId ? await storage.get('PROJECT_REPO_' + projectId) : []
  return {
    octokit: octokit,
    makerSuiteApiKey: APP_KEYS.makerSuite,
    owner: APP_KEYS.repoOwner,
    repos
  }

}

/**
 * Checks if the comment branches exist in the provided repositories.
 * @param {string} originalBranchName - Name of the original branch.
 * @param {string} enrichBranchName - Name of the enrich branch.
 * @param {Object} octokit - The Octokit object.
 * @param {string} owner - The owner of the repositories.
 * @param {Array} repos - List of repositories.
 * @returns {Object} Information about the branches.
 */
const checkIfCommentBranchExists = async (originalBranchName, enrichBranchName, octokit, owner, repos) => {
  for (const repo of repos) {
    try {
      const branches = await octokit.repos.listBranches({
        owner,
        repo
      });
      const foundOriginal = branches.data.find(branch => branch.name === originalBranchName);
      const foundEnrich = branches.data.find(branch => branch.name === enrichBranchName);
      if (foundOriginal || foundEnrich) {
        return {
          originalBranchRepo: foundOriginal ? repo : '',
          enrichBranchRepo: foundEnrich ? repo : ''
        };
      }
    } catch (error) {
      console.error(error);
    }
  }
  return {
    originalBranchRepo: '',
    enrichBranchRepo: ''
  }
}

/**
 * Calls Generative AI to generate comments based on the provided prompt.
 * @param {string} prompt - The prompt for the Generative AI.
 * @param {string} makerSuiteApiKey - API key for Maker Suite.
 * @returns {string} Generated comments.
 */
const callGenerativeAI = async (prompt, makerSuiteApiKey) => {
  try {
    const choiceCount = 1;
    const url = `https://generativelanguage.googleapis.com/v1beta3/models/text-bison-001:generateText?key=${makerSuiteApiKey}`;

    const payload = {
      "prompt": {
        "text": prompt
      },
      "temperature": 0.7,
      "top_k": 40,
      "top_p": 0.95,
      "candidate_count": 1,
      "max_output_tokens": 1024,
      "stop_sequences": [],
      "safety_settings": [
        {
          "category": "HARM_CATEGORY_DEROGATORY",
          "threshold": 1
        },
        {
          "category": "HARM_CATEGORY_TOXICITY",
          "threshold": 1
        },
        {
          "category": "HARM_CATEGORY_VIOLENCE",
          "threshold": 2
        },
        {
          "category": "HARM_CATEGORY_SEXUAL",
          "threshold": 2
        },
        {
          "category": "HARM_CATEGORY_MEDICAL",
          "threshold": 2
        },
        {
          "category": "HARM_CATEGORY_DANGEROUS",
          "threshold": 2
        }
      ]
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    };

    const response = await fetch(url, options);
    if (response.status === 200) {
      const data = await response.json();
      return data.candidates[0].output
    } else {
      const data = await response.text();
      return ''
    }
  } catch (error) {
    console.log(error)
    return ''
  }
}

/**
 * Resolves if comment branches exist for a Jira issue.
 */
resolver.define('comments-branch-exists', async (req) => {
  const key = req.context.extension.issue.key;

  const projectId = req.context.extension.project.id

  const res = await api.asApp().requestJira(route`/rest/api/3/issue/${key}?fields=key,summary,description`);

  const data = await res.json();

  const { octokit, owner, repos } = await getConfig(projectId)
  if (!owner) {
    const enrichData = {
      status: "no-config",
    }
    return {
      enrichData
    };
  }

  if (!repos || repos.length == 0) {
    const enrichData = {
      status: "no-repo",
    }
    return {
      enrichData
    };
  }
  const summary = data.fields.summary ? data.fields.summary.replaceAll(' ', '-') : ''
  const originalBranchName = data.key + "-" + (summary != '' ? (summary) : '')
  const enrichBranchName = data.key + "-" + (summary != '' ? (summary + '-') : '') + "enrich"
  const { originalBranchRepo, enrichBranchRepo } = await checkIfCommentBranchExists(originalBranchName, enrichBranchName, octokit, owner, repos);

  const enrichData = {
    status: "ok",
    originalBranchRepo: originalBranchRepo,
    enrichBranchRepo: enrichBranchRepo,
    owner: owner,
    originalBranchName: originalBranchName,
    originalBranchUrl: `https://github.com/${owner}/${originalBranchRepo}/tree/${originalBranchName}`,
    enrichBranchName: enrichBranchName,
    enrichBranchUrl: `https://github.com/${owner}/${enrichBranchRepo}/tree/${enrichBranchName}`,
    compareUrl: `https://github.com/${owner}/${enrichBranchRepo}/compare/${originalBranchName}...${enrichBranchName}?diff=split`,
    enrichBranchExist: enrichBranchRepo != ''
  }

  return {
    enrichData
  };
});

/**
 * Resolves the request to delete an enrich branch.
 */
resolver.define('delete-enrich-branch', async (req) => {
  const key = req.context.extension.issue.key;
  const { branchPath } = req.payload;
  const branchDetails = branchPath.split('/')

  if (branchDetails.length != 3 && !branchDetails[2].startsWith(key) || !branchDetails[2].endsWith('-enrich')) {
    const response = {
      status: 'error',
      message: 'You are not allowed to delete a non enrich branch'
    }
    return {
      response
    }
  }
  const response = {
    status: 'ok'
  }
  try {
    const { octokit, owner, makerSuiteApiKey } = await getConfig(null)
    await octokit.git.deleteRef({
      owner: branchDetails[0],
      repo: branchDetails[1],
      ref: `heads/${branchDetails[2]}`
    });

  } catch (error) {
    response.status = 'error'
    response.message = error

    if (error.status === 404) {
    } else {
      console.error(error);
    }
  }
  return {
    response
  }
});

/**
 * Resolves the request to generate comments.
 */
resolver.define('generate-comments', async (req) => {
  const key = req.context.extension.issue.key;
  const { originalBranchName, enrichBranchName, originalBranchRepo, enrichBranchRepo, owner, creationType } = req.payload;
  await getFileDifferenceAndCommit(originalBranchName, enrichBranchName, originalBranchRepo, creationType);
  const enrichData = {
    originalBranchRepo: originalBranchRepo,
    enrichBranchRepo: enrichBranchRepo,
    owner: owner,
    originalBranchName: originalBranchName,
    originalBranchUrl: `https://github.com/${owner}/${originalBranchRepo}/tree/${originalBranchName}`,
    enrichBranchName: enrichBranchName,
    enrichBranchUrl: `https://github.com/${owner}/${enrichBranchRepo}/tree/${enrichBranchName}`,
    compareUrl: `https://github.com/${owner}/${enrichBranchRepo}/compare/${originalBranchName}...${enrichBranchName}`,
    enrichBranchExist: true
  }
  return {
    enrichData
  };
});

/**
 * Gets the difference between two branches and commits the changes to a new branch.
 * @param {string} originalBranchName - Name of the original branch.
 * @param {string} newBranchName - Name of the new branch.
 * @param {string} originalBranchRepo - Repository of the original branch.
 * @param {string} creationType - Type of creation ('M' for modified, other for new branch).
 * @returns {boolean} True if successful, false otherwise.
 */
const getFileDifferenceAndCommit = async (originalBranchName, newBranchName, originalBranchRepo, creationType) => {
  try {

    const { octokit, owner, makerSuiteApiKey } = await getConfig(null)
    if (!owner) {
      return false;
    }


    // Get the latest commit on the branch
    const latestCommitResponse = await octokit.rest.repos.getBranch({
      owner: owner,
      repo: originalBranchRepo,
      branch: originalBranchName,
    });
    const latestCommitSha = latestCommitResponse.data.commit.sha;

    const commitDiffResponse = await (creationType == 'M' ?
      octokit.rest.repos.compareCommits({
        owner: owner,
        repo: originalBranchRepo,
        base: 'main',
        head: originalBranchName,
      })
      : octokit.rest.repos.getCommit({
        owner: owner,
        repo: originalBranchRepo,
        ref: latestCommitSha,
      }));

    const newBranchResponse = await octokit.rest.git.createRef({
      owner: owner,
      repo: originalBranchRepo,
      ref: `refs/heads/${newBranchName}`,
      sha: latestCommitSha,
    });

    const filesChanged = commitDiffResponse.data.files;

    const promises = filesChanged.map(async (file) => {
      if (file.status === "added" || file.status === "modified") {
        try {
          const fileResponse = await octokit.rest.repos.getContent({
            owner: owner,
            repo: originalBranchRepo,
            path: file.filename,
            ref: latestCommitSha,
          });

          const content = Buffer.from(fileResponse.data.content, "base64").toString("utf-8");

          const aiContent = await callGenerativeAI(`Add code comments to the provided code ${content}. Do not remove any code`, makerSuiteApiKey);
          const modifiedContent = aiContent == '' ? content : aiContent.replace(/```[a-zA-Z]+\n/g, '').replace(/```/g, '');

          return {
            fileResponse,
            modifiedContent,
            file,
          };
        } catch (error) {
          console.error(`Error processing file '${file.filename}':`, error);
        }
      }
    });

    const processedFiles = await Promise.all(promises);

    for (const { fileResponse, modifiedContent, file } of processedFiles) {
      try {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: owner,
          repo: originalBranchRepo,
          path: file.filename,
          message: "Enrich AI Comments added",
          content: Buffer.from(modifiedContent).toString("base64"),
          branch: newBranchName,
          sha: fileResponse.data.sha,
        });

      } catch (error) {
        console.error(`Error processing file '${file.filename}':`, error);
      }
    }
    return true;
  } catch (error) {
    console.error(error);
  }
  return false;
}

/**
 * Gets the first and last commits of a branch.
 * @param {string} branchName - Name of the branch.
 * @param {Object} octokit - The Octokit object.
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The repository name.
 * @returns {Object} Object containing the first and last commit SHA.
 */
const getFirstAndLastCommits = async (branchName, octokit, owner, repo) => {
  try {
    const commitsResponse = await octokit.rest.repos.listCommits({
      owner: owner,
      repo: repo,
      sha: branchName,
    });

    let firstCommitSha = null;
    let lastCommitSha = null;

    for (const commit of commitsResponse.data) {
      if (commit.parents.length === 1) {
        if (commit.parents[0].sha === firstCommitSha) {
          firstCommitSha = commit.sha;
        } else {
          lastCommitSha = commit.sha;
          break;
        }
      }
    }
    return { firstCommitSha, lastCommitSha };
  } catch (error) {
    console.error(error);
  }
}

/**
 * Gets the modified files and their contents between two branches.
 * @param {string} mainBranch - Name of the main branch.
 * @param {string} otherBranch - Name of the other branch.
 * @param {Object} octokit - The Octokit object.
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The repository name.
 * @param {string} makerSuiteApiKey - API key for Maker Suite.
 * @returns {Array} List of modified files with details.
 */
const getModifiedFilesAndContents = async (mainBranch, otherBranch, octokit, owner, repo, makerSuiteApiKey) => {
  try {
    const commitDiffResponse = await octokit.rest.repos.compareCommits({
      owner: owner,
      repo: repo,
      base: mainBranch,
      head: otherBranch,
    });

    const filesChanged = commitDiffResponse.data.files;
    const modifiedFiles = [];

    const filePromises = filesChanged.map(async (file) => {
      if (
        file.status === "added" ||
        file.status === "modified" ||
        file.status === "changed" ||
        file.status === "renamed"
      ) {
        let originalContent = '';
        try {
          const originalFileResponse = await octokit.rest.repos.getContent({
            owner: owner,
            repo: repo,
            path: file.filename,
            ref: mainBranch,

          });
          originalContent = Buffer.from(
            originalFileResponse.data.content,
            "base64"
          ).toString("utf-8");
        } catch (error) {
          console.error(`Error fetching original content for ${file.filename}: ${error.message}`);
        }

        let latestContent = '';
        try {
          const latestFileResponse = await octokit.rest.repos.getContent({
            owner: owner,
            repo: repo,
            path: file.filename,
            ref: otherBranch,
          });

          latestContent = Buffer.from(
            latestFileResponse.data.content,
            "base64"
          ).toString("utf-8");
        } catch (error) {
          console.error(`Error fetching latest content for ${file.filename}: ${error.message}`);
        }

        const aiResponse = await callGenerativeAI(
          `Provide a summary of new changes in simple English between the old file 
          and new file OLD FILE: 
          ${originalContent}. 
          \n 
          ${latestContent} 
          don't add any code blocks in your response`
          , makerSuiteApiKey);

        modifiedFiles.push({
          filename: file.filename,
          status: '(' + (originalContent != '' ? 'modified' : file.status) + ')',
          details: aiResponse,
        });
      }
    });

    await Promise.all(filePromises);

    return modifiedFiles;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Summarizes the code changes between two branches.
 */
resolver.define('summarize-code', async (req) => {
  const key = req.context.extension.issue.key;
  const { originalBranchName, originalBranchRepo } = req.payload;
  const { octokit, owner, makerSuiteApiKey } = await getConfig(null)
  if (!owner) {
    return false;
  }

  const modifiedFiles = await getModifiedFilesAndContents('main', originalBranchName, octokit, owner, originalBranchRepo, makerSuiteApiKey);
  return {
    summary: modifiedFiles
  }
});

/**
 * Exports the handler for the resolver.
 */
export const handler = resolver.getDefinitions();