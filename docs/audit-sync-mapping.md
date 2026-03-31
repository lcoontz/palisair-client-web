# Photo Audit → BigQuery Sync Mapping

After the client completes their photo audit, run a sync script to push changes
back to BigQuery. This document maps every possible audit action to its BQ effect.

## Photo-level changes (from `photo_audit` table)

| Audit action | Supabase field | BQ effect |
|---|---|---|
| **Approve photo** | `status = 'approved'` | No BQ change — approval is audit-only metadata |
| **Flag: low quality** | `status = 'flagged'`, `flag_reason = 'low_quality'` | Mark all items in this photo with `internal_review_status = 'low_quality_photo'` |
| **Flag: duplicate photo** | `status = 'flagged'`, `flag_reason = 'duplicate_photo'` | Mark all items as `review_action = 'duplicate'` — items will be excluded from final count |
| **Flag: missing detail** | `status = 'flagged'`, `flag_reason = 'missing_detail'` | Add note to all items: `notes = CONCAT(notes, ' [AUDIT: more photo detail needed]')`. No status change — items are still valid, just need re-photography |
| **Move to another room** | `room_folder` changed, `moved_from_room` set | Move items to the target room's BQ table: DELETE from source table, INSERT into target table. Update `images_found_in` path to reflect new room folder |
| **Comment** | `comment` set | Append to `notes` field on all items in this photo: `notes = CONCAT(notes, ' [CLIENT: {comment}]')` |
| **Toggle overview** | `is_overview` changed | No BQ change — overview classification is audit-only |
| **Link photos** | `link_group_id` set | See "Photo linking" section below |

## Item-level changes (from `photo_items` table)

| Audit action | Supabase field | BQ effect |
|---|---|---|
| **Change audit_status to 'final'** | `audit_status = 'final'` | Set `review_action = 'final'` on the BQ row matching `row_id` in the room's batch table |
| **Change audit_status to 'wrong'** | `audit_status = 'wrong'` | Set `review_action = 'wrong detection'` |
| **Change audit_status to 'duplicate'** | `audit_status = 'duplicate'` | Set `review_action = 'duplicate'` |
| **Change audit_status to 'needs_review'** | `audit_status = 'needs_review'` | Set `review_action = 'client review'` |

## Photo linking → Pipeline re-run (NOT automated sync)

When photos are linked (same `link_group_id`), it means the client identified
that multiple photos show the same physical item(s) from different angles.

**This does NOT auto-sync to BQ.** Instead, linked photos trigger a manual
pipeline re-run:

1. Query all `photo_audit` rows with the same `link_group_id`
2. DELETE existing detected items for all linked photos from their BQ room tables
3. Re-run detection passing ALL linked photos together as a single multi-image
   input, so the AI sees every angle and produces one consolidated item list
4. The re-detection replaces the old items with better-informed detections

This is a human-triggered pipeline operation, not part of the automated sync.
The audit app stores the `link_group_id` grouping; a separate script or
workflow handles the re-detection when the auditor is ready.

## Sync script usage

```bash
npx tsx scripts/sync-audit-to-bigquery.ts
```

The script:
1. Reads all `photo_audit` rows where `reviewed_at IS NOT NULL`
2. Reads all `photo_items` rows where `audit_status` differs from the original
   (compares against `pipeline_status`/`review_action`/`visual_match` to detect changes)
3. Groups changes by BQ room table
4. Applies updates via BQ UPDATE queries
5. Logs every change for audit trail

## Room table mapping

| Supabase `room_folder` | BQ table |
|---|---|
| `Palisair Photos/01 Master Bed` | `palisair_contents._01_master_bed_batch` |
| `Palisair Photos/02 Master Bath` | `palisair_contents._02_master_bath_batch` |
| `Palisair Photos/03 Office` | `palisair_contents._03_office_batch` |
| `Palisair Photos/05 Office Bath` | `palisair_contents._05_office_bath_batch` |
| `Palisair Photos/05 Shared Bath` | `palisair_contents._05_shared_bath_batch` |
| `Palisair Photos/06 Living Room` | `palisair_contents._06_living_room_batch` |
| `Palisair Photos/07 Coat Closet` | `palisair_contents._07_coat_closet_batch` |
| `Palisair Photos/08 Entry Bathroom` | `palisair_contents._08_entry_bathroom_batch` |
| `Palisair Photos/09 Den` | `palisair_contents._09_den_batch` |
| `Palisair Photos/10 Kitchen` | `palisair_contents._10_kitchen_batch` |
| `Palisair Photos/Kitchen P2` | `palisair_contents._10_kitchen_batch` |
| `Palisair Photos/11 Garage` | `palisair_contents._11_garage_batch` |
| `Palisair Photos/11 Garage overview ` | `palisair_contents._11_garage_batch` |
| `Palisair Photos/Garage P2` | `palisair_contents._11_garage_batch` |
| `Palisair Photos/12 Laundry room` | `palisair_contents._12_laundry_room_batch` |
| `Palisair Photos/13 Outside items` | `palisair_contents._13_outside_items_batch` |
| `Palisair Photos/Den P2` | `palisair_contents._09_den_batch` |
| `Palisair Photos/Living Room P2` | `palisair_contents._06_living_room_batch` |
| `Palisair Photos/Hallway` | `palisair_contents.hallway_batch` |
| `Palisair Photos/Will Office` | `palisair_contents.will_office_batch` |
