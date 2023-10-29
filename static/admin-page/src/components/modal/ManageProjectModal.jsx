import React, { useEffect, useState, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import { Grid } from '@atlaskit/primitives';
import Button, { LoadingButton } from '@atlaskit/button';
import { Checkbox } from '@atlaskit/checkbox';

import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
    ModalTransition,
} from '@atlaskit/modal-dialog';

const ManageProjectModal = ({ isOpen, setIsOpen, repositories, project, setRows }) => {

    const closeModal = useCallback(() => setIsOpen(false), []);
    const [repoList, setRepoList] = useState(new Map());
    const [isLoadingSave, setIsLoadingSave] = useState(false);

    const updateRepoList = useCallback((event, value) => {
        const updatedRepoList = new Map(repoList);
        if (event.target.checked) {
            updatedRepoList.set(value, value);
        } else {
            updatedRepoList.delete(value);
        }
        setRepoList(updatedRepoList);
    })

    const mapToArray = (map) => {
        return Array.from(map.keys());
    };

    useEffect(() => {
        if (project) {
            const updatedRepoList = new Map();
            project.repos.map((repo) => {
                updatedRepoList.set(repo, repo);
            })
            setRepoList(updatedRepoList);
        }
    }, [project]);

    const submitRepoList = useCallback(() => {
        setIsLoadingSave(true);
        const repoArray = mapToArray(repoList);
        const payload = {
            projectId: project.id,
            repo: repoArray
        }

        invoke('update-project-repo-mapping', payload).then((data) => {
            if (data.status == "ok") {
                setRows(prevRows => prevRows.map(row => {
                    if (row.id === project.id) {
                        return { ...row, repos: repoArray };
                    }
                    return row;
                }));
                setIsOpen(false);
            }
            setIsLoadingSave(false);
        }
        );
    })

    return (
        <ModalTransition>
            {isOpen && (
                <Modal onClose={closeModal}>
                    <ModalHeader>
                        <ModalTitle>Update Repositories for <b>{project.name}</b></ModalTitle>
                    </ModalHeader>
                    <div style={{ borderBottom: '1px solid #ECECEC', width: '100%' }} />

                    <ModalBody>
                        <Grid gap="space.200" alignItems="center" alignContent='start' templateColumns="4fr 4fr 2fr" templateRows='3rem'>

                            {repositories && repositories.map((repo, index) => {
                                return (
                                    <Checkbox key={index}
                                        isChecked={repoList.get(repo.name)}
                                        value={repo.name}
                                        label={repo.name}
                                        onChange={(event) => updateRepoList(event, repo.name)}
                                        name="checkbox-default"
                                    />
                                )
                            })}
                        </Grid>
                    </ModalBody>
                    <div style={{ borderBottom: '1px solid #ECECEC', width: '100%' }} />
                    <ModalFooter>
                        <Button appearance="subtle" onClick={closeModal}>
                            Close
                        </Button>
                        <LoadingButton isLoading={isLoadingSave} appearance="primary" onClick={submitRepoList}>
                            Update
                        </LoadingButton>
                    </ModalFooter>
                </Modal>
            )}
        </ModalTransition>
    )
}

export default ManageProjectModal;