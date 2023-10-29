import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { view, events, invoke, router, Modal } from '@forge/bridge';
import Spinner from '@atlaskit/spinner';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Button, { ButtonGroup } from '@atlaskit/button';
import SectionMessage from '@atlaskit/section-message';
import ProgressBar from '@atlaskit/progress-bar';


const ActiveEnrichBranchActionsPanel = ({ enrichData }) => {
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
        branchPath: enrichData.owner+'/'+enrichData.enrichBranchRepo+'/'+ enrichData.enrichBranchName,
      };
      setLoading(true)
      const res = await invoke('delete-enrich-branch', payload);
      setLoading(false)
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

  export default ActiveEnrichBranchActionsPanel