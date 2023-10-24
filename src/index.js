import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { Octokit } from '@octokit/rest';
const { TextServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");

const resolver = new Resolver();




const owner = 'godwinpinto'; // Replace with the owner of the repository
const repo = 'calculator-example'; // Replace with the name of the repository


const octokit = new Octokit({
  auth: ''
});



const checkIfCommentBranchExists = async (branchName) => {
  console.log('check branch')
  try {
    const response = await octokit.repos.getBranch({
      owner,
      repo,
      branch: branchName
    });
    //setBranchExists(true)
    console.log(`Branch "${branchName}" exists in the repository.`);
    return true
  } catch (error) {
    if (error.status === 404) {
      console.log(`Branch "${branchName}" does not exist in the repository.`);
    } else {
      console.error(error);
    }
    //setBranchExists(false)
    return false
  }
}

resolver.define('fetchLabels', async (req) => {
  const key = req.context.extension.issue.key;

  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${key}?fields=labels`);

  const data = await res.json();

  //const branchExistsRes =await checkIfCommentBranchExists();

  const label = data.fields.labels;
  if (label == undefined) {
    console.warn(`${key}: Failed to find labels`);
    return [];
  }

  return label;
});


resolver.define('comments-branch-exists', async (req) => {
  const key = req.context.extension.issue.key;

  const res = await api.asApp().requestJira(route`/rest/api/3/issue/${key}?fields=key,summary,description`);

  const data = await res.json();

  console.log('data', data)
  const summary = data.fields.summary ? data.fields.summary.replaceAll(' ', '-') : ''
  const originalBranchName = data.key + "-" + (summary != '' ? (summary) : '')
  const enrichBranchName = data.key + "-" + (summary != '' ? (summary + '-') : '') + "enrich"

  console.log('enrichBranchName', enrichBranchName)

  const branchExistsRes = await checkIfCommentBranchExists(enrichBranchName);

  // const label = data.fields.labels;
  // if (label == undefined) {
  //   console.warn(`${key}: Failed to find labels`);
  //   return [];
  // }
  //https://github.com/godwinpinto/temp/compare/SCRUM-1-Some-test-issue...SCRUM-1-Some-test-issue-enrich
  const enrichData = {
    originalBranchName: originalBranchName,
    originalBranchUrl: `https://github.com/${owner}/${repo}/tree/${originalBranchName}`,
    enrichBranchName: enrichBranchName,
    enrichBranchUrl: `https://github.com/${owner}/${repo}/tree/${enrichBranchName}`,
    compareUrl: `https://github.com/${owner}/${repo}/compare/${originalBranchName}...${enrichBranchName}`,
    enrichBranchExist: branchExistsRes
  }

  return {
    enrichData
  };
});

resolver.define('delete-enrich-branch', async (req) => {
  const key = req.context.extension.issue.key;
  const { branchName } = req.payload;
  console.log('branchName', branchName)
  console.log('key', key)
  if (!branchName.startsWith(key) || !branchName.endsWith('-enrich')) {
    console.log('not allowed')
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
    await octokit.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branchName}`
    });

  } catch (error) {
    response.status = 'error'
    response.message = error

    if (error.status === 404) {
      console.log(`Branch "${branchName}" does not exist in the repository.`);
    } else {
      console.error(error);
    }
    //setBranchExists(false)
  }


  return {
    response
  }


});


const AIGeneratedComments = async (fileContent) => {

  try {

    console.log("code entered")
    const MODEL_NAME = "models/text-bison-001";
    const API_KEY = "XXXXX";

    const client = new TextServiceClient({
      authClient: new GoogleAuth().fromAPIKey(API_KEY),
    });

    const promptString = `Add code comments to the provided code ${fileContent}. Do not remove any code`;
    const stopSequences = [];
    console.log("Executing")

    const aiResponse = await client.generateText({
      model: MODEL_NAME,
      temperature: 0.7,
      candidateCount: 1,
      top_k: 40,
      top_p: 0.95,
      max_output_tokens: 1024,
      stop_sequences: stopSequences,
      safety_settings: [{ "category": "HARM_CATEGORY_DEROGATORY", "threshold": 1 }, { "category": "HARM_CATEGORY_TOXICITY", "threshold": 1 }, { "category": "HARM_CATEGORY_VIOLENCE", "threshold": 2 }, { "category": "HARM_CATEGORY_SEXUAL", "threshold": 2 }, { "category": "HARM_CATEGORY_MEDICAL", "threshold": 2 }, { "category": "HARM_CATEGORY_DANGEROUS", "threshold": 2 }],
      prompt: {
        text: promptString,
      },
    });
    console.log(JSON.stringify(aiResponse))
    return aiResponse[0].candidates[0].output

  } catch (error) {
    console.log(error)
    console.log('error')
    return ''
  }

}


resolver.define('generate-comments', async (req) => {
  const key = req.context.extension.issue.key;
  const { originalBranchName, enrichBranchName } = req.payload;
  console.log('originalBranchName', originalBranchName);
  console.log('enrichBranchName', enrichBranchName);

  //const aiContent=await AIGeneratedComments('console.log("hello world")');
  await getFileDifferenceAndCommit(originalBranchName, enrichBranchName);

  const enrichData = {
    originalBranchName: originalBranchName,
    originalBranchUrl: `https://github.com/${owner}/${repo}/tree/${originalBranchName}`,
    enrichBranchName: enrichBranchName,
    enrichBranchUrl: `https://github.com/${owner}/${repo}/tree/${enrichBranchName}`,
    compareUrl: `https://github.com/${owner}/${repo}/compare/${originalBranchName}...${enrichBranchName}`,
    enrichBranchExist: true
  }

  return {
    enrichData
  };
});


const getFileDifferenceAndCommit = async (originalBranchName, newBranchName) => {
  try {
    // Get the latest commit on the branch
    const latestCommitResponse = await octokit.rest.repos.getBranch({
      owner: owner,
      repo: repo,
      branch: originalBranchName,
    });

    const latestCommitSha = latestCommitResponse.data.commit.sha;

    // Get the list of files changed in the latest commit
    const commitDiffResponse = await octokit.rest.repos.getCommit({
      owner: owner,
      repo: repo,
      ref: latestCommitSha,
    });

    const filesChanged = commitDiffResponse.data.files;

    // Create a new branch to commit the modified file
    const newBranchResponse = await octokit.rest.git.createRef({
      owner: owner,
      repo: repo,
      ref: `refs/heads/${newBranchName}`, // Replace with your desired branch name
      sha: latestCommitSha,
    });

    // Get the content of each changed or added file in the latest commit
    for (const file of filesChanged) {
      console.log("hello",file.filename+'-'+file.status);
      if (file.status === "added" || file.status === "modified") {
        const fileResponse = await octokit.rest.repos.getContent({
          owner: owner,
          repo: repo,
          path: file.filename,
          ref: latestCommitSha,
        });

        const content = Buffer.from(
          fileResponse.data.content,
          "base64"
        ).toString("utf-8");

        // Append "hello world" to the content
        console.log(content)
        const aiContent = await AIGeneratedComments(content)
        const modifiedContent = aiContent == '' ? content : aiContent.replace(/```java/g, '').replace(/```/g, '');


        // Update the file with the modified content
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: owner,
          repo: repo,
          path: file.filename,
          message: "Enrich AI Comments added",
          content: Buffer.from(modifiedContent).toString("base64"),
          branch: newBranchName, // Replace with the branch name you created
          sha: fileResponse.data.sha,
        });

        console.log(`File '${file.filename}' modified and committed.`);
      }
    }

    console.log("All files modified and committed successfully.");
  } catch (error) {
    console.error(error);
  }
}

async function getFirstAndLastCommits(branchName) {
  try {
    const commitsResponse = await octokit.rest.repos.listCommits({
      owner: owner,
      repo: repo,
      sha: branchName,
    });

    const firstCommitSha = commitsResponse.data[commitsResponse.data.length - 1].sha;
    const lastCommitSha = commitsResponse.data[0].sha;
    console.log(firstCommitSha, lastCommitSha)
    return { firstCommitSha, lastCommitSha };
  } catch (error) {
    console.error(error);
  }
}

async function getModifiedFilesAndContents(firstCommitSha, lastCommitSha) {
  try {
    const commitDiffResponse = await octokit.rest.repos.compareCommits({
      owner: owner,
      repo: repo,
      base: firstCommitSha,
      head: lastCommitSha,
    });

    const filesChanged = commitDiffResponse.data.files;
    const modifiedFiles = [];

    for (const file of filesChanged) {
      if (file.status === "added" || file.status === "modified" || file.status === "changed" || file.status === "renamed") {

        let originalContent = ''
        try {
          const originalFileResponse = await octokit.rest.repos.getContent({
            owner: owner,
            repo: repo,
            path: file.filename,
            ref: firstCommitSha,
          });
          originalContent = Buffer.from(
            originalFileResponse.data.content,
            "base64"
          ).toString("utf-8");
        } catch (error) {

        }
        let latestContent = ''
        try {
          const latestFileResponse = await octokit.rest.repos.getContent({
            owner: owner,
            repo: repo,
            path: file.filename,
            ref: lastCommitSha,
          });

          latestContent = Buffer.from(
            latestFileResponse.data.content,
            "base64"
          ).toString("utf-8");
        } catch (error) {

        }

        const aiResponse = await AIGeneratedSummary(originalContent, latestContent)
        modifiedFiles.push({
          filename: file.filename,
          status: file.status,
          details:aiResponse,
        });
      }
    }

    return modifiedFiles;
  } catch (error) {
    console.error(error);
  }
}

resolver.define('summarize-code', async (req) => {
  const key = req.context.extension.issue.key;
  const { originalBranchName } = req.payload;
  console.log('originalBranchName', originalBranchName);

  const { firstCommitSha, lastCommitSha } = await getFirstAndLastCommits(originalBranchName);
  if (firstCommitSha && lastCommitSha) {
    const modifiedFiles = await getModifiedFilesAndContents(firstCommitSha, lastCommitSha);
    console.log(JSON.stringify(modifiedFiles, null, 2));
    return {
      summary: modifiedFiles
    }
  }
  return {
    summary: []
  };
});


const AIGeneratedSummary = async (fileContentOld, fileContentNew) => {

  try {

    console.log("code entered")
    const MODEL_NAME = "models/text-bison-001";
    const API_KEY = "XXXXX";

    const client = new TextServiceClient({
      authClient: new GoogleAuth().fromAPIKey(API_KEY),
    });

    const promptString = `Provide a summary of new changes in simple english between the old file and new file OLD FILE: ${fileContentOld}. \n ${fileContentNew}`;
    const stopSequences = [];
    console.log("Executing")

    const aiResponse = await client.generateText({
      model: MODEL_NAME,
      temperature: 0.7,
      candidateCount: 1,
      top_k: 40,
      top_p: 0.95,
      max_output_tokens: 1024,
      stop_sequences: stopSequences,
      safety_settings: [{ "category": "HARM_CATEGORY_DEROGATORY", "threshold": 1 }, { "category": "HARM_CATEGORY_TOXICITY", "threshold": 1 }, { "category": "HARM_CATEGORY_VIOLENCE", "threshold": 2 }, { "category": "HARM_CATEGORY_SEXUAL", "threshold": 2 }, { "category": "HARM_CATEGORY_MEDICAL", "threshold": 2 }, { "category": "HARM_CATEGORY_DANGEROUS", "threshold": 2 }],
      prompt: {
        text: promptString,
      },
    });
    console.log(JSON.stringify(aiResponse))
    return aiResponse[0].candidates[0].output

  } catch (error) {
    console.log(error)
    console.log('error')
    return ''
  }

}

export const handler = resolver.getDefinitions();
