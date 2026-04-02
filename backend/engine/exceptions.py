class WorkflowError(Exception):
    pass


class PluginError(WorkflowError):
    pass


class PluginNotFoundError(WorkflowError):
    pass


class PluginExecutionError(WorkflowError):
    pass


class GraphCycleError(WorkflowError):
    pass


class WorkflowValidationError(WorkflowError):
    pass


class StateNotFoundError(WorkflowError):
    pass
