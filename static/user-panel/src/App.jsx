import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { view, events, invoke, router, Modal } from '@forge/bridge';
import Spinner from '@atlaskit/spinner';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Button, { ButtonGroup } from '@atlaskit/button';
import SectionMessage from '@atlaskit/section-message';
import ProgressBar from '@atlaskit/progress-bar';
import NoEnrichBranchActionsPanel from './components/panel/NoEnrichBranchActionsPanel';
import ActiveEnrichBranchActionsPanel from './components/panel/ActiveEnrichBranchActionsPanel';
import SummarizeBranchTabView from './components/panel/SummarizeBranchTabView';
import SummaryPopup from './components/panel/SummaryPopup';
import EmptyState from '@atlaskit/empty-state';

function App() {
  const [initialLoader, setInitialLoader] = useState('');
  const [summaryDetails, setSummaryDetails] = useState(null);
  const [branchData, setBranchData] = useState(null);
  const [data, setData] = useState(null);

  const [selected, setSelected] = useState(0);

  const handleUpdate = useCallback(
    (index) => setSelected(index),
    [setSelected],
  );

  useEffect(() => {
    (async () => {
      let popup = false;
      try {
        const context = await view.getContext();
        const { summary } = context.extension.modal;
        if (summary) {
          setSummaryDetails(summary);
        }
        popup = true;
      } catch (error) { }
      if (!popup) {
        const commentsBranchExists = async () => invoke('comments-branch-exists');
        commentsBranchExists().then((response) => {
          setInitialLoader(response.enrichData.status)
          if (response.enrichData.status == "ok") {
            setBranchData(response);
          }
        }).catch(() => {
          console.log('error')
        });

      }
    })();
  }, []);


  return (
    <div>
      {summaryDetails ? (
        <SummaryPopup summaryArray={summaryDetails} />
      ) : initialLoader == '' ? (

        <Spinner size="large" />) : initialLoader == 'no-config' || initialLoader == 'no-repo' ? (
          <>
            <SectionMessage appearance="warning" title="Welcome to Enrich.AI">
              <p>{initialLoader == 'no-config' ? 'Adminstrator has not configured Enrich.AI' : 'There is no repository mapped by administrator for this Jira project'}</p>
            </SectionMessage>
          </>
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
                <ActiveEnrichBranchActionsPanel enrichData={branchData.enrichData} />
              ) : (
                <NoEnrichBranchActionsPanel enrichData={branchData.enrichData} />
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
