import React, { useEffect, useState, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import { Grid } from '@atlaskit/primitives';
import Button from '@atlaskit/button';
import EmptyState from '@atlaskit/empty-state';
import TagGroup from '@atlaskit/tag-group';
import { SimpleTag as Tag } from '@atlaskit/tag';
import ManageProjectModal from '../modal/ManageProjectModal';

const ProjectPanel = ({ secrets, refreshContent }) => {
    const [repositories, setRepositories] = useState(null);
    const [rows, setRows] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const openModal = useCallback((row) => {
        setSelectedRow(row)
        setIsOpen(true)
    }, []);
    const closeModal = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        if (secrets.makerSuite != '' && refreshContent != 0) {
            invoke('get-git-projects').then((data) => {
                setRepositories(data.repositories)
                setRows(data.projects)
            });
        }
    }, [secrets.makerSuite, refreshContent]);

    return (
        <div style={{ width: "100%" }}>
            {secrets.makerSuite == '' ? (<EmptyState
                header="Welcome to Enrich.AI"
                description="Please visit the configuration and secrets settings tabs to configure and enable Enrich.AI."
            />) : (<div>
                <Grid gap="space.200" alignItems="center" alignContent='start' templateColumns="4fr 4fr 2fr" templateRows='3rem' >
                    <div><b>Project</b></div>
                    <div><b>Mapped Repositories</b></div>
                    <div><b>Manage Repositories</b></div>
                </Grid>
                <div style={{ borderBottom: '2px solid #ECECEC', width: '100%' }} />
                {rows && rows.map((row, index) => {
                    return (
                        <div key={'row' + index} style={{ marginTop: '20px', marginBottom: '20px' }}>
                            <Grid gap="space.200" alignItems="center" alignContent='start' templateColumns="4fr 4fr 2fr" >
                                <div><b>{row.name}</b></div>
                                <div><TagGroup>
                                    {row.repos.map((repo, index) => {
                                        return (
                                            <Tag text={repo} key={row.id + '-' + index} />
                                        )
                                    })}
                                </TagGroup></div>
                                <div><Button appearance='link' onClick={() => openModal(row)}  >Manage Repositories</Button></div>
                            </Grid>
                            <div style={{ borderBottom: '1px solid #ECECEC', width: '100%' }} />
                        </div>
                    )
                }


                )}

            </div>)
            }
            <ManageProjectModal isOpen={isOpen} setIsOpen={setIsOpen} repositories={repositories} project={selectedRow} setRows={setRows} />
        </div>
    )
}

export default ProjectPanel;