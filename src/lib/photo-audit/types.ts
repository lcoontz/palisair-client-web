export interface PhotoAudit {
  id: string;
  property_id: string;
  room_folder: string;
  room_display_name: string;
  filename: string;
  gcs_path: string;
  photo_url: string;
  item_count: number;
  primary_category: string | null;
  all_categories: string[] | null;
  is_overview: boolean;
  photo_timestamp: string | null;
  sequence_number: number | null;
  status: "pending" | "approved" | "flagged";
  flag_reason: string | null;
  comment: string | null;
  moved_from_room: string | null;
  link_group_id: string | null;
  thumbnail_url: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoItem {
  id: string;
  photo_audit_id: string;
  row_id: string | null;
  item_name: string;
  object_type: string | null;
  standardized_category: string | null;
  confidence: string | null;
  bounding_box: number[] | null;
  audit_status: "final" | "needs_review" | "duplicate" | "wrong";
  review_action: string | null;
  pipeline_status: string | null;
  visual_match: string | null;
  created_at: string;
}

export interface PhotoAuditRoom {
  room_folder: string;
  room_display_name: string;
  total_photos: number;
  reviewed_count: number;
  approved_count: number;
  flagged_count: number;
}

export interface PhotoAuditProgress {
  total_photos: number;
  reviewed: number;
  approved: number;
  flagged: number;
  pending: number;
  rooms_complete: number;
  rooms_total: number;
}

export interface PhotosResponse {
  photos: PhotoAudit[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
