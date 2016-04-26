import { AssignmentService as LocalAssignmentService } from './services/local/assignment-service';
import { NodeService as LocalNodeService } from './services/local/node-service';

import { AssignmentService as RemoteAssignmentService } from './services/remote/assignment-service';
import { NodeService as RemoteNodeService } from './services/remote/node-service';


export {
  LocalAssignmentService,
  LocalNodeService,
  RemoteAssignmentService,
  RemoteNodeService
};

export var Local = {
  AssignmentService: LocalAssignmentService,
  NodeService: LocalNodeService,
};

export var Remote = {
  AssignmentService: RemoteAssignmentService,
  NodeService: RemoteNodeService,
};

export default { Local, Remote };
