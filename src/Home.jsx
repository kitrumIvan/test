import { get, post, put } from 'aws-amplify/api'
import { signOut } from 'aws-amplify/auth'

import { useEffect, useState } from 'react'
import './App.css'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Close'
import LogoutIcon from '@mui/icons-material/Logout'

import { Typography } from '@mui/material'

import {
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
  GridToolbarContainer,
} from '@mui/x-data-grid'

function EditToolbar (props) {
  const { setRows, rowModesModel, setRowModesModel } = props

  const buttonDisabled = () => {
    return Object.keys(rowModesModel).length !== 0
  }

  const handleAddUser = () => {
    setRows((oldRows) => {
      return [{
        id: '',
        firstName: '',
        lastName: '',
      }, ...oldRows]
    })
    setRowModesModel((oldModel) => ({ ...oldModel, ['']: { mode: GridRowModes.Edit } }))
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <GridToolbarContainer style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button color="inherit" startIcon={<AddIcon/>} onClick={handleAddUser} disabled={buttonDisabled()}>
        Add User
      </Button>
      <Button color="inherit" startIcon={<LogoutIcon/>} onClick={handleSignOut}>
        Sign Out
      </Button>
    </GridToolbarContainer>
  )
}

export default function FullFeaturedCrudGrid () {
  const [rows, setRows] = useState([])
  const [rowModesModel, setRowModesModel] = useState({})

  const addUser = async (firstName, lastName) => {
    try {
      const payload = {
        id: parseInt(Date.now() * Math.random()),
        firstName, lastName
      }
      const restOperation = post({
        apiName: 'usersApi',
        path: '/users',
        options: {
          body: payload
        }
      })
      const response = await restOperation.response
      let message = await response.body.json()
      return payload
    } catch (error) {
      console.log('POST call failed: ', error)
    }
  }

  const updateUser = async (id, firstName, lastName) => {
    try {
      const payload = { id, firstName, lastName }
      const restOperation = put({
        apiName: 'usersApi',
        path: '/users',
        options: {
          body: payload
        }
      })
      const response = await restOperation.response
      let message = await response.body.json()
      console.log(message)
    } catch (error) {
      console.log('PUT call failed: ', error)
    }
  }

  useEffect(() => {
    async function fetchUsers () {
      try {
        const restOperation = get({
          apiName: 'usersApi',
          path: '/users',
        })
        const response = await restOperation.response
        let message = await response.body.json()
        console.log(message)
        setRows(message)
      } catch (error) {
        console.log('GET call failed: ', error)
      }
    }

    fetchUsers()
  }, [])

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true
    }
  }

  const handleEditClick = (id) => () => {
    const alreadyInEditMode = Object.keys(rowModesModel)
      .filter(key => rowModesModel[key].mode === 'edit')
      .reduce((obj, key) => {
        obj[key] = rowModesModel[key]
        return obj
      }, {})

    if (Object.keys(alreadyInEditMode).length === 0) {
      setRowModesModel({
        ...rowModesModel, [id]: { mode: GridRowModes.Edit }
      })
    }
  }

  const handleSaveClick = (id, row) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } })
  }

  const handleCancelClick = (id) => () => {
    if (id === '') {
      setRows(rows.filter((row) => row.id !== id))
    }
    setRowModesModel({
      ...rowModesModel, [id]: { mode: GridRowModes.View, ignoreModifications: true },
    })
  }

  const processRowUpdate = async (newRow, oldRow) => {
    if (newRow?.id === '') {
      const newUser = await addUser(newRow.firstName, newRow.lastName)
      const updatedRow = { ...newUser, isNew: false }
      setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)))
      return updatedRow
    } else {
      return await processEditUser(newRow, oldRow)
    }
  }

  const processEditUser = async (newRow, oldRow) => {
    const updatedRow = { ...newRow, isNew: false }
    await updateUser(newRow.id, newRow.firstName, newRow.lastName)
    setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)))
    return updatedRow
  }

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel)
  }

  const columns = [{
    field: 'id',
    headerName: 'ID',
    headerAlign: 'center',
    editable: false,
    flex: 1,
  }, {
    field: 'firstName',
    headerName: 'First Name',
    editable: true,
    minWidth: 100,
    flex: 2,
  }, {
    field: 'lastName',
    headerName: 'Last Name',
    align: 'left',
    headerAlign: 'left',
    editable: true,
    minWidth: 100,
    flex: 2,
  }, {
    field: 'actions',
    type: 'actions',
    headerName: 'Actions',
    cellClassName: 'actions',
    minWidth: 70,
    flex: 1,
    getActions:
      ({ id, row }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit
        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon/>}
              label="Save"
              sx={{ color: 'primary.main' }}
              onClick={handleSaveClick(id, row)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon/>}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />
          ]
        }
        return [
          <GridActionsCellItem
            icon={<EditIcon/>}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />
        ]
      }
  }]
  return (
    <Box className={'table'}>
      <Typography className="typography" variant="h5">Users List</Typography>
      <DataGrid
        rows={rows}
        editMode="row"
        columns={columns}
        rowModesModel={rowModesModel}
        showCellVerticalBorder
        showColumnVerticalBorder
        experimentalFeatures={{ newEditingApi: true }}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        onCellDoubleClick={(event) => {
          event.isEditable = false
        }}
        onRowDoubleClick={(event) => {
          event.isEditable = false
        }}
        slots={{
          toolbar: EditToolbar
        }}
        slotProps={{
          toolbar: {
            setRows,
            rowModesModel,
            setRowModesModel,
          }
        }}
        sx={{
          '&.MuiDataGrid-root': {
            border: '2px solid black',
            borderCollapse: 'collapse',
          },
          '& .MuiDataGrid-cell': {
            border: '1px solid black',
            borderCollapse: 'collapse',
          },
          '& .MuiDataGrid-columnHeader': {
            border: '1px solid black',
            borderCollapse: 'collapse',
          },
          '& .MuiDataGrid-filler': {
            border: '1px solid black',
            borderCollapse: 'collapse',
          }
        }}
      />
    </Box>)
}