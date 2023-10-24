import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { view, events, invoke, router, Modal } from '@forge/bridge';
import Spinner from '@atlaskit/spinner';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Button, { ButtonGroup } from '@atlaskit/button';
import SectionMessage from '@atlaskit/section-message';
import ProgressBar from '@atlaskit/progress-bar';

export const ActiveEnrichBranchActions = ({ enrichData }) => {
  const [loading, setLoading] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState('');

  const openMergePanel = () => {
    router.open(enrichData.compareUrl);
  }


  const openEnrichBranch = () => {
    router.open(enrichData.enrichBranchUrl);
  }

  const deleteEnrichBranch = useCallback(async () => {
    const payload = {
      branchName: enrichData.enrichBranchName,
    };
    setLoading(true)
    const res = await invoke('delete-enrich-branch', payload);
    setLoading(false)
    console.log('response', res)
    if (res.response.status == 'ok')
      setDeleteStatus('ok')
    else
      setDeleteStatus('error')
    setTimeout(reloadPanel, 3000)


  }, [enrichData.enrichBranchName]);

  const reloadPanel = () => {
    router.reload();
  }


  return (
    <div style={{ width: '90%', display: 'flex', flexDirection: 'column', marginTop: "10px" }}>
      <div style={{ width: '100%' }}>
        <p> You AI generated code comment branch is ready</p>
        <ul>
          <li><strong>View Enrich Branch: </strong>View this branch on Github</li>
          <li><strong>Open Merge Panel: </strong>Open in Github viewer to compare and merge</li>
          <li><strong>Delete Enrich Branch: </strong>Once done clean up the enrich branch</li>
        </ul>
      </div>
      <div
        style={{
          padding: '2rem',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {loading ? (
          <div style={{ marginBottom: "20px" }}>
            <ProgressBar ariaLabel="Loading issues" isIndeterminate />
          </div>
        ) : ''}
        <ButtonGroup>
          <Button onClick={openEnrichBranch} appearance="primary">View Enrich Branch</Button>
          <Button onClick={openMergePanel} appearance="primary">Open Merge Panel</Button>
          <Button onClick={deleteEnrichBranch} appearance="warning">Delete Enrich Branch</Button>
        </ButtonGroup>
        {deleteStatus && deleteStatus == 'ok' ? (
          <SectionMessage appearance="success" title="Enrich branch deleted. Reloading page." />
        ) : deleteStatus && deleteStatus == 'error' ? (

          <SectionMessage
            title="Something went wrong. Reloading page."
            appearance="error"
          />

        ) : ''
        }

      </div>
    </div>
  )
}

export const SummarizeBranchTabView = ({ enrichData }) => {



  const [isOpen, setIsOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const summarizeCode = useCallback(async () => {
    const payload = {
      originalBranchName: enrichData.originalBranchName,
    };
    setLoading(true)
    const res = await invoke('summarize-code', payload);

    setLoading(false)

    console.log('response', res)

    const modal = new Modal({
      //resource: 'main-app',
      onClose: (payload) => { },
      size: 'xlarge',
      context: {
        summary: res.summary,
      },
    });
    modal.open();

  }, [enrichData.enrichBranchName]);



  const reloadPanel = () => {
    router.reload();
  }


  return (
    <div style={{ width: '90%', display: 'flex', flexDirection: 'column', marginTop: "10px" }}>
      <div style={{ width: '100%' }}>
        <p> Generate summary for all (first to last commit) Github repo files (updated / added) linked with this issue (helps to prepare your pull requests)</p>
      </div>
      <div
        style={{
          padding: '2rem',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {loading ? (
          <div style={{ marginBottom: "20px" }}>
            <ProgressBar ariaLabel="Loading issues" isIndeterminate />
          </div>
        ) : ''}
        <ButtonGroup>
          <Button onClick={summarizeCode} appearance="primary">Generate Code Summary</Button>

        </ButtonGroup>

        {/* {deleteStatus && deleteStatus == 'ok' ? (
          <SectionMessage appearance="success" title="Enrich branch deleted" />
        ) : deleteStatus && deleteStatus == 'error' ? (

          <SectionMessage
            title="Something went wrong"
            appearance="error"
          />

        ) : ''
        } */}

      </div>
    </div>
  )
}


export const NoEnrichBranchActions = ({ enrichData }) => {
  const [loading, setLoading] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState('');
  const generateComments = useCallback(async () => {
    console.log("calling api")
    const payload = {
      originalBranchName: enrichData.originalBranchName,
      enrichBranchName: enrichData.enrichBranchName,
    };
    setLoading(true)
    const res = await invoke('generate-comments', payload);
      setDeleteStatus('ok')
    setTimeout(reloadPanel, 3000)
    setLoading(false)
    console.log('response', res)

  }, [enrichData.enrichBranchName]);

  const reloadPanel = () => {
    router.reload();
  }
  return (
    <div style={{ width: '90%', display: 'flex', flexDirection: 'column', marginTop: "10px" }}>
      <div style={{ width: '100%' }}>

        <p> Generate doc comments in your code with Enrich.AI.</p>
        <ul>
          <li><strong>Last commit: </strong>Add doc comments to files that differ in this branch by only 1 commit</li>
          <li><strong>All commit: </strong>Add doc comments to files that were made to this branch</li>
          <li><strong>Compare with Main Branch: </strong>Add doc comments to files that difference in this branch in comparison to main branch</li>
          <li><strong><i>Note:</i> </strong>This action will generate a new branch (from the chosen action) and will not affect your work</li>
        </ul>
      </div>
      <div
        style={{
          padding: '2rem',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <ButtonGroup>
          <Button appearance="primary" onClick={generateComments}>Last Commit</Button>
          <Button appearance="primary" onClick={generateComments}>All Commits</Button>
          <Button appearance="primary">With Main Branch</Button>
        </ButtonGroup>
        {loading ? (
          <div style={{ marginTop: "20px" }}>
            <ProgressBar ariaLabel="Loading issues" isIndeterminate />
          </div>
        ) : ''}
        {deleteStatus && deleteStatus == 'ok' ? (
          <SectionMessage appearance="success" title="Enrich branch created. Reloading page." />
        ) : deleteStatus && deleteStatus == 'error' ? (

          <SectionMessage
            title="Something went wrong. Reloading page."
            appearance="error"
          />

        ) : ''
        }
      </div>
    </div>
  )
}


export const SummaryPopup = ({ summaryArray }) => {

  return (
    <div style={{ width: '95%', display: 'flex', flexDirection: 'column', margin: "10px" }}>
      {summaryArray.map(item => (
        <div tyle={{ width: '100%' }}>
          <SectionMessage
            title={`${item.filename} ${item.status}`}
          >
            <p dangerouslySetInnerHTML={{ __html: item.details.replace(/\n/g, '<br/>') }} />
          </SectionMessage>

          <hr />
        </div>
      ))}
    </div>
  )
}

function App() {
  const [summaryDetails, setSummaryDetails] = useState(null);
  const [branchData, setBranchData] = useState(null);
  const [data, setData] = useState(null);

  const [selected, setSelected] = useState(0);

  const handleUpdate = useCallback(
    (index) => setSelected(index),
    [setSelected],
  );

  const handleFetchSuccess = (data) => {
    setData(data);
    if (data.length === 0) {
      throw new Error('No labels returned');
    }
  };
  const handleFetchError = () => {
    console.error('Failed to get label');
  };

  useEffect(() => {
    (async () => {
      let popup = false;
      try {
        const context = await view.getContext();
        //setContext(context);
        console.log("hereeu")
        const { summary } = context.extension.modal;
        console.log("summary", summary)
        if (summary) {
          setSummaryDetails(summary);
        }
        popup = true;
      } catch (error) { }
      //console.log(summary)
      if (!popup) {
        console.log("executing summary", summaryDetails)
        const commentsBranchExists = async () => invoke('comments-branch-exists');
        commentsBranchExists().then((response) => {
          console.log('fetched', response)
          setBranchData(response);
        }).catch(() => {
          console.log('error')
        });

      }
    })();
  }, []);

  // useEffect(() => {

  // }, []);




  // useEffect(() => {
  //   const fetchLabels = async () => invoke('fetchLabels');

  //   fetchLabels().then(handleFetchSuccess).catch(handleFetchError);
  //   const subscribeForIssueChangedEvent = () =>
  //     events.on('JIRA_ISSUE_CHANGED', () => {
  //       fetchLabels().then(handleFetchSuccess).catch(handleFetchError);
  //     });
  //   const subscription = subscribeForIssueChangedEvent();

  //   return () => {
  //     subscription.then((subscription) => subscription.unsubscribe());
  //   };
  // }, []);

  // if (!data) {
  //   return (
  //     <>
  //     <div>Loading...</div>
  //     </>);
  // }
  //const labels = data.map((label) => <div>{label}</div>);
  return (
    <div>
      {summaryDetails ? (
        <SummaryPopup summaryArray={summaryDetails} />
      ) : (

        <Tabs

          onChange={handleUpdate} selected={selected} id="controlled"
        >
          <TabList>
            <Tab>Code Comments</Tab>
            <Tab>Code Summarize</Tab>
            <Tab>Code Feedback</Tab>
          </TabList>
          <TabPanel>
            {branchData == null ?
              (<Spinner size="large" />) :
              branchData.enrichData.enrichBranchExist == true ? (
                <ActiveEnrichBranchActions enrichData={branchData.enrichData} />
              ) : (
                <NoEnrichBranchActions enrichData={branchData.enrichData} />
              )
            }
          </TabPanel>
          <TabPanel>
            {branchData == null ?
              (<Spinner size="large" />) :
              (
                <SummarizeBranchTabView enrichData={branchData.enrichData} />
              )
            }
          </TabPanel>
          <TabPanel>
            Work In Progress (Coming Soon)
          </TabPanel>
        </Tabs>

      )
      }

    </div>
  );
}

export default App;
