
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "blocked_domains": {
                  Row: {
                    "created_at": string,"domain": string,"note": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"domain": string,"note"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"domain"?: string,"note"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"crawl_targets": {
                  Row: {
                    "created_at": string,"detail_url_pattern": string | null,"enabled": boolean,"id": string,"last_crawled_at": string | null,"last_listing_hash": string | null,"listing_url": string,"terms_reviewed_at": string | null,"updated_at": string,"updated_by": string | null,"venue_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"detail_url_pattern"?: string | null,"enabled"?: boolean,"id"?: string,"last_crawled_at"?: string | null,"last_listing_hash"?: string | null,"listing_url": string,"terms_reviewed_at"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"venue_id": string
                  }
                  Update: {
                    "created_at"?: string,"detail_url_pattern"?: string | null,"enabled"?: boolean,"id"?: string,"last_crawled_at"?: string | null,"last_listing_hash"?: string | null,"listing_url"?: string,"terms_reviewed_at"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"venue_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "crawl_targets_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"crawled_pages": {
                  Row: {
                    "checked_at": string,"content_hash": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checked_at"?: string,"content_hash": string,"url": string
                  }
                  Update: {
                    "checked_at"?: string,"content_hash"?: string,"url"?: string
                  }
                  Relationships: [
                    
                  ]
                },"exhibition_sources": {
                  Row: {
                    "content_hash": string | null,"created_at": string,"exhibition_id": string,"fetched_at": string | null,"id": string,"match_reason": string | null,"origin": Database["public"]['Enums']["source_origin"],"publisher": Database["public"]['Enums']["source_publisher"],"raw_venue_name": string | null,"registered_by": string | null,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content_hash"?: string | null,"created_at"?: string,"exhibition_id": string,"fetched_at"?: string | null,"id"?: string,"match_reason"?: string | null,"origin": Database["public"]['Enums']["source_origin"],"publisher": Database["public"]['Enums']["source_publisher"],"raw_venue_name"?: string | null,"registered_by"?: string | null,"url": string
                  }
                  Update: {
                    "content_hash"?: string | null,"created_at"?: string,"exhibition_id"?: string,"fetched_at"?: string | null,"id"?: string,"match_reason"?: string | null,"origin"?: Database["public"]['Enums']["source_origin"],"publisher"?: Database["public"]['Enums']["source_publisher"],"raw_venue_name"?: string | null,"registered_by"?: string | null,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exhibition_sources_exhibition_id_fkey"
      columns: ["exhibition_id"]
isOneToOne: false
      referencedRelation: "exhibitions"
      referencedColumns: ["id"]
    }
                  ]
                },"exhibitions": {
                  Row: {
                    "created_at": string,"end_date": string,"id": string,"image_url": string | null,"normalized_title": string,"official_url": string | null,"start_date": string,"title": string,"updated_at": string,"venue_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"end_date": string,"id"?: string,"image_url"?: string | null,"normalized_title": string,"official_url"?: string | null,"start_date": string,"title": string,"updated_at"?: string,"venue_id": string
                  }
                  Update: {
                    "created_at"?: string,"end_date"?: string,"id"?: string,"image_url"?: string | null,"normalized_title"?: string,"official_url"?: string | null,"start_date"?: string,"title"?: string,"updated_at"?: string,"venue_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exhibitions_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"interests": {
                  Row: {
                    "created_at": string,"exhibition_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"exhibition_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"exhibition_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "interests_exhibition_id_fkey"
      columns: ["exhibition_id"]
isOneToOne: false
      referencedRelation: "exhibitions"
      referencedColumns: ["id"]
    }
                  ]
                },"pending_registrations": {
                  Row: {
                    "content_hash": string,"created_at": string,"extraction": NonNullable<Json>,"id": string,"image_url": string | null,"publisher": Database["public"]['Enums']["source_publisher"],"url": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content_hash": string,"created_at"?: string,"extraction": NonNullable<Json>,"id"?: string,"image_url"?: string | null,"publisher": Database["public"]['Enums']["source_publisher"],"url": string,"user_id": string
                  }
                  Update: {
                    "content_hash"?: string,"created_at"?: string,"extraction"?: NonNullable<Json>,"id"?: string,"image_url"?: string | null,"publisher"?: Database["public"]['Enums']["source_publisher"],"url"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"registration_attempts": {
                  Row: {
                    "created_at": string,"id": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_policies": {
                  Row: {
                    "allow_images": boolean,"allow_links": boolean,"domain": string,"note": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allow_images"?: boolean,"allow_links"?: boolean,"domain": string,"note"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "allow_images"?: boolean,"allow_links"?: boolean,"domain"?: string,"note"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"venues": {
                  Row: {
                    "address": string | null,"created_at": string,"id": string,"municipality": string | null,"name": string,"place_id": string,"prefecture": string | null,"updated_at": string,"website_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"created_at"?: string,"id"?: string,"municipality"?: string | null,"name": string,"place_id": string,"prefecture"?: string | null,"updated_at"?: string,"website_url"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"created_at"?: string,"id"?: string,"municipality"?: string | null,"name"?: string,"place_id"?: string,"prefecture"?: string | null,"updated_at"?: string,"website_url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "source_origin": "crawl"|"user","source_publisher": "venue"|"organizer"|"third_party"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "source_origin": ["crawl", "user"],"source_publisher": ["venue", "organizer", "third_party"]
          }
        }
} as const
