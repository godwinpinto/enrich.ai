
import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { view, events, invoke, router, Modal } from '@forge/bridge';
import Spinner from '@atlaskit/spinner';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Button, { ButtonGroup } from '@atlaskit/button';
import SectionMessage from '@atlaskit/section-message';
import ProgressBar from '@atlaskit/progress-bar';


const SummaryPopup = ({ summaryArray }) => {

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

  export default SummaryPopup