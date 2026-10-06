// Bu dosya `npm run db:types` ile Supabase şemasından üretilir; elle düzenleme.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      dorm_requests: {
        Row: {
          city: string;
          created_at: string;
          dorm_name: string;
          id: number;
          status: Database["public"]["Enums"]["request_status"];
          user_id: string;
        };
        Insert: {
          city: string;
          created_at?: string;
          dorm_name: string;
          id?: never;
          status?: Database["public"]["Enums"]["request_status"];
          user_id: string;
        };
        Update: {
          city?: string;
          created_at?: string;
          dorm_name?: string;
          id?: never;
          status?: Database["public"]["Enums"]["request_status"];
          user_id?: string;
        };
        Relationships: [];
      };
      dorms: {
        Row: {
          city: string;
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
        };
        Insert: {
          city: string;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          name: string;
        };
        Update: {
          city?: string;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          created_at: string;
          description: string | null;
          dorm_id: number;
          expires_at: string;
          id: string;
          missing_amount: number | null;
          owner_id: string;
          people_needed: number;
          platform: Database["public"]["Enums"]["listing_platform"];
          price_per_person: number | null;
          restaurant: string;
          status: Database["public"]["Enums"]["listing_status"];
          type: Database["public"]["Enums"]["listing_type"];
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          dorm_id: number;
          expires_at?: string;
          id?: string;
          missing_amount?: number | null;
          owner_id: string;
          people_needed?: number;
          platform: Database["public"]["Enums"]["listing_platform"];
          price_per_person?: number | null;
          restaurant: string;
          status?: Database["public"]["Enums"]["listing_status"];
          type: Database["public"]["Enums"]["listing_type"];
        };
        Update: {
          created_at?: string;
          description?: string | null;
          dorm_id?: number;
          expires_at?: string;
          id?: string;
          missing_amount?: number | null;
          owner_id?: string;
          people_needed?: number;
          platform?: Database["public"]["Enums"]["listing_platform"];
          price_per_person?: number | null;
          restaurant?: string;
          status?: Database["public"]["Enums"]["listing_status"];
          type?: Database["public"]["Enums"]["listing_type"];
        };
        Relationships: [
          {
            foreignKeyName: "listings_dorm_id_fkey";
            columns: ["dorm_id"];
            isOneToOne: false;
            referencedRelation: "dorms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      phone_claims: {
        Row: {
          created_at: string;
          id: number;
          note: string | null;
          phone: string;
          status: Database["public"]["Enums"]["report_status"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          note?: string | null;
          phone: string;
          status?: Database["public"]["Enums"]["report_status"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          note?: string | null;
          phone?: string;
          status?: Database["public"]["Enums"]["report_status"];
          user_id?: string;
        };
        Relationships: [];
      };
      phone_reveals: {
        Row: {
          created_at: string;
          id: number;
          listing_id: string;
          viewer_id: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          listing_id: string;
          viewer_id: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          listing_id?: string;
          viewer_id?: string;
        };
        Relationships: [];
      };
      profile_private: {
        Row: {
          consent_at: string;
          phone: string;
          phone_changed_at: string | null;
          phone_verified: boolean;
          user_id: string;
        };
        Insert: {
          consent_at?: string;
          phone: string;
          phone_changed_at?: string | null;
          phone_verified?: boolean;
          user_id: string;
        };
        Update: {
          consent_at?: string;
          phone?: string;
          phone_changed_at?: string | null;
          phone_verified?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_private_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          block: string | null;
          created_at: string;
          dorm_id: number;
          full_name: string;
          id: string;
          is_admin: boolean;
          status: Database["public"]["Enums"]["profile_status"];
        };
        Insert: {
          block?: string | null;
          created_at?: string;
          dorm_id: number;
          full_name: string;
          id: string;
          is_admin?: boolean;
          status?: Database["public"]["Enums"]["profile_status"];
        };
        Update: {
          block?: string | null;
          created_at?: string;
          dorm_id?: number;
          full_name?: string;
          id?: string;
          is_admin?: boolean;
          status?: Database["public"]["Enums"]["profile_status"];
        };
        Relationships: [
          {
            foreignKeyName: "profiles_dorm_id_fkey";
            columns: ["dorm_id"];
            isOneToOne: false;
            referencedRelation: "dorms";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          id: number;
          listing_id: string | null;
          note: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          reported_user_id: string;
          reporter_id: string;
          status: Database["public"]["Enums"]["report_status"];
        };
        Insert: {
          created_at?: string;
          id?: never;
          listing_id?: string | null;
          note?: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          reported_user_id: string;
          reporter_id: string;
          status?: Database["public"]["Enums"]["report_status"];
        };
        Update: {
          created_at?: string;
          id?: never;
          listing_id?: string | null;
          note?: string | null;
          reason?: Database["public"]["Enums"]["report_reason"];
          reported_user_id?: string;
          reporter_id?: string;
          status?: Database["public"]["Enums"]["report_status"];
        };
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey";
            columns: ["reported_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_delete_dorm: { Args: { p_id: number }; Returns: undefined };
      admin_dorm_stats: {
        Args: { p_limit?: number };
        Returns: {
          active_listing_count: number;
          city: string;
          dorm_id: number;
          listing_count: number;
          name: string;
          user_count: number;
        }[];
      };
      admin_resolve_phone_claim: { Args: { p_claim_id: number }; Returns: undefined };
      admin_resolve_report: { Args: { p_report_id: number }; Returns: undefined };
      admin_review_dorm_request: {
        Args: { p_approve: boolean; p_city?: string; p_name?: string; p_request_id: number };
        Returns: undefined;
      };
      admin_save_dorm: { Args: { p_city: string; p_id: number | null; p_name: string }; Returns: number };
      admin_set_dorm_active: { Args: { p_active: boolean; p_id: number }; Returns: undefined };
      admin_set_user_status: {
        Args: { p_status: Database["public"]["Enums"]["profile_status"]; p_user_id: string };
        Returns: undefined;
      };
      close_listing: {
        Args: { p_listing_id: string; p_status: Database["public"]["Enums"]["listing_status"] };
        Returns: undefined;
      };
      complete_profile: {
        Args: { p_block: string; p_consent: boolean; p_dorm_id: number; p_full_name: string; p_phone: string };
        Returns: undefined;
      };
      delete_my_account: { Args: never; Returns: undefined };
      extend_listing: { Args: { p_listing_id: string }; Returns: string };
      is_active_user: { Args: never; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
      my_dorm_id: { Args: never; Returns: number };
      reveal_phone: { Args: { p_listing_id: string }; Returns: string };
    };
    Enums: {
      listing_platform: "yemeksepeti" | "getir" | "trendyol" | "migros" | "phone_order" | "other";
      listing_status: "active" | "matched" | "closed" | "hidden";
      listing_type: "min_basket" | "shared_menu" | "delivery_fee";
      profile_status: "active" | "suspended" | "banned";
      report_reason: "wrong_number" | "not_their_number" | "spam" | "inappropriate" | "other";
      report_status: "open" | "resolved";
      request_status: "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
