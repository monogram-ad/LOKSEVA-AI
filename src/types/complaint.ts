export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type DepartmentName =
  | 'Water Board'
  | 'Electricity Department'
  | 'Roads & PWD'
  | 'Sanitation'
  | 'Police'
  | 'Health'
  | 'General';

export type ComplaintStatus = 'New' | 'In Progress' | 'Resolved' | 'Assigned' | 'Received';

export interface ComplaintClassification {
  topic: string;
  urgency: UrgencyLevel;
  department: DepartmentName;
  location: string;
  summary: string;
  reason: string;
  confidence: number;
  isMultiIssue: boolean;
}

export interface SimilarComplaintMatch {
  id: string;
  topic: string;
  summary: string;
  similarity: number; // 0.0 to 1.0
  clusterId: string;
  department: DepartmentName;
  location: string;
  urgency: UrgencyLevel;
  timestamp: string;
}

export interface StoredComplaint extends ComplaintClassification {
  id: string;
  transcript: string;
  callerId?: string;
  timestamp: string;
  status: ComplaintStatus;
  clusterId: string;
  embedding?: number[];
  similarComplaints?: SimilarComplaintMatch[];
  overriddenByOfficer?: boolean;
  overriddenDepartment?: DepartmentName;
  overriddenAt?: string;
}

export interface ComplaintCluster {
  id: string;
  department: DepartmentName;
  representativeTopic: string;
  representativeSummary: string;
  location: string;
  highestUrgency: UrgencyLevel;
  memberComplaints: StoredComplaint[];
  createdAt: string;
  updatedAt: string;
}

export interface IngestParams {
  transcript: string;
  callerId?: string;
  timestamp?: string;
}
