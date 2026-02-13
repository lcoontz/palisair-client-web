export interface Item {
  id: string;
  row_id: string;
  room_slug: string;
  item: string;
  item_description: string | null;
  quantity: number;
  brand: string | null;
  features: string | null;
  category: string | null;
  price: number | null;
  shipping_cost: number | null;
  tax: number | null;
  total_cost: number | null;
  units_per_product: number | null;
  original_msrp: number | null;
  purchase_link: string | null;
  cropped_image_url: string | null;
  images_found_in: string | null;
  product_name: string | null;
  review_action: string | null;
  review_note: string | null;
  target_price: number | null;
  search_status: string | null;
  status: string | null;
  visual_match: string | null;
  internal_review_status: string | null;
  volume_or_size: string | null;
  client_feedback: string | null;
  sync_status: "synced" | "pending_push" | "push_failed";
  local_modified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  slug: string;
  display_name: string;
  bq_table_id: string;
  dataset_id: string;
  item_count: number;
  total_value: number;
  priced_count: number;
  last_synced_at: string | null;
}

export interface OverviewStats {
  total_items: number;
  total_value: number;
  priced_count: number;
  rooms: RoomStats[];
}

export interface RoomStats {
  slug: string;
  display_name: string;
  item_count: number;
  priced_count: number;
  total_value: number;
}

export interface ItemsResponse {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClientItemUpdatePayload {
  review_action?: string | null;
  client_feedback?: string | null;
  target_price?: number | null;
}
