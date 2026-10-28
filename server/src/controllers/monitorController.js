import {
  createMonitor,
  getMonitorsSummary,
  listMonitors,
  getMonitorById,
  updateMonitor,
  deleteMonitor,
  toggleMonitorStatus,
} from '../services/monitorService.js';

export async function handleGetSummary(req, res, next) {
  try {
    const data = await getMonitorsSummary(req.user.id);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleListMonitors(req, res, next) {
  try {
    const data = await listMonitors(req.user.id);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateMonitor(req, res, next) {
  try {
    const data = await createMonitor(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Monitor created successfully and scheduled for initial check',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMonitorById(req, res, next) {
  try {
    const data = await getMonitorById(req.user.id, req.params.id);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateMonitor(req, res, next) {
  try {
    const data = await updateMonitor(req.user.id, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Monitor updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteMonitor(req, res, next) {
  try {
    await deleteMonitor(req.user.id, req.params.id);
    res.json({
      success: true,
      message: 'Monitor and historical telemetry deleted successfully',
      data: { id: req.params.id },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleToggleMonitor(req, res, next) {
  try {
    const data = await toggleMonitorStatus(req.user.id, req.params.id);
    res.json({
      success: true,
      message: data.isActive ? 'Monitor resumed' : 'Monitor paused',
      data,
    });
  } catch (err) {
    next(err);
  }
}
