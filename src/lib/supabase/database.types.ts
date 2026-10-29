// Generated from the Supabase schema. Regenerate after each migration.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      content_history: {
        Row: {
          id: string;
          created_at: string;
          actor_id: string | null;
          entity: string;
          record_key: string;
          operation: string;
          before_data: Json | null;
          after_data: Json | null;
        };
        Insert: {
          entity: string;
          record_key: string;
          operation: string;
          before_data?: Json | null;
          after_data?: Json | null;
        };
        Update: { before_data?: Json | null };
        Relationships: [];
      };

      shop_checkouts: {
        Row: {
          id: string;
          customer_id: string | null;
          expires_at: string | null;
          items: Json;
          last_error: string;
          livemode: boolean;
          shipping_cents: number;
          shipping_method: string;
          vat_rate: number;
          total_cents: number;
          updated_at: string;
          state: string;
          stripe_request: Json | null;
          stripe_session_id: string | null;
          stripe_session_url: string | null;
          order_id: string | null;
          customer_email_sent: boolean;
          admin_email_sent: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          customer_id?: string | null;
          expires_at?: string | null;
          items: Json;
          last_error?: string;
          livemode?: boolean;
          shipping_cents: number;
          shipping_method: string;
          vat_rate: number;
          total_cents: number;
          updated_at?: string;
          state?: string;
          stripe_request?: Json | null;
          stripe_session_id?: string | null;
          stripe_session_url?: string | null;
          order_id?: string | null;
          customer_email_sent?: boolean;
          admin_email_sent?: boolean;
          created_at?: string;
        };
        Update: {
          expires_at?: string | null;
          last_error?: string;
          livemode?: boolean;
          updated_at?: string;
          state?: string;
          stripe_request?: Json | null;
          stripe_session_id?: string | null;
          stripe_session_url?: string | null;
          order_id?: string | null;
          customer_email_sent?: boolean;
          admin_email_sent?: boolean;
        };
        Relationships: [];
      };
      business_terms: {
        Row: {
          business_id: string;
          term_id: string;
        };
        Insert: {
          business_id: string;
          term_id: string;
        };
        Update: {
          business_id?: string;
          term_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_terms_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_terms_term_id_fkey";
            columns: ["term_id"];
            isOneToOne: false;
            referencedRelation: "directory_terms";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          address: string;
          created_at: string;
          description: string;
          email: string;
          id: string;
          location: string;
          logo_media_id: string | null;
          name: string;
          opening_hours: Json;
          owner_id: string | null;
          phone: string;
          phone_2: string;
          seo: Json;
          short_description: string;
          slug: string;
          status: Database["public"]["Enums"]["publish_status"];
          updated_at: string;
          website: string;
          wp_id: number | null;
        };
        Insert: {
          address?: string;
          created_at?: string;
          description?: string;
          email?: string;
          id?: string;
          location?: string;
          logo_media_id?: string | null;
          name: string;
          opening_hours?: Json;
          owner_id?: string | null;
          phone?: string;
          phone_2?: string;
          seo?: Json;
          short_description?: string;
          slug: string;
          status?: Database["public"]["Enums"]["publish_status"];
          updated_at?: string;
          website?: string;
          wp_id?: number | null;
        };
        Update: {
          address?: string;
          created_at?: string;
          description?: string;
          email?: string;
          id?: string;
          location?: string;
          logo_media_id?: string | null;
          name?: string;
          opening_hours?: Json;
          owner_id?: string | null;
          phone?: string;
          phone_2?: string;
          seo?: Json;
          short_description?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["publish_status"];
          updated_at?: string;
          website?: string;
          wp_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_logo_media_id_fkey";
            columns: ["logo_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      directory_terms: {
        Row: {
          created_at: string;
          icon_media_id: string | null;
          id: string;
          kind: Database["public"]["Enums"]["directory_term_kind"];
          label: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          icon_media_id?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["directory_term_kind"];
          label: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          icon_media_id?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["directory_term_kind"];
          label?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "directory_terms_icon_media_id_fkey";
            columns: ["icon_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          contact_email: string;
          created_at: string;
          description: string;
          end_time: string | null;
          ends_on: string | null;
          facebook_url: string;
          id: string;
          location: string;
          organiser: string;
          poster_media_id: string | null;
          seo: Json;
          slug: string;
          start_time: string | null;
          starts_on: string;
          status: Database["public"]["Enums"]["publish_status"];
          title: string;
          updated_at: string;
          wp_id: number | null;
        };
        Insert: {
          contact_email?: string;
          created_at?: string;
          description?: string;
          end_time?: string | null;
          ends_on?: string | null;
          facebook_url?: string;
          id?: string;
          location?: string;
          organiser?: string;
          poster_media_id?: string | null;
          seo?: Json;
          slug: string;
          start_time?: string | null;
          starts_on: string;
          status?: Database["public"]["Enums"]["publish_status"];
          title: string;
          updated_at?: string;
          wp_id?: number | null;
        };
        Update: {
          contact_email?: string;
          created_at?: string;
          description?: string;
          end_time?: string | null;
          ends_on?: string | null;
          facebook_url?: string;
          id?: string;
          location?: string;
          organiser?: string;
          poster_media_id?: string | null;
          seo?: Json;
          slug?: string;
          start_time?: string | null;
          starts_on?: string;
          status?: Database["public"]["Enums"]["publish_status"];
          title?: string;
          updated_at?: string;
          wp_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_poster_media_id_fkey";
            columns: ["poster_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          alt: string;
          created_at: string;
          file_name: string;
          height: number | null;
          id: string;
          mime_type: string;
          path: string;
          size_bytes: number;
          uploaded_by: string | null;
          width: number | null;
          wp_id: number | null;
        };
        Insert: {
          alt?: string;
          created_at?: string;
          file_name: string;
          height?: number | null;
          id?: string;
          mime_type: string;
          path: string;
          size_bytes: number;
          uploaded_by?: string | null;
          width?: number | null;
          wp_id?: number | null;
        };
        Update: {
          alt?: string;
          created_at?: string;
          file_name?: string;
          height?: number | null;
          id?: string;
          mime_type?: string;
          path?: string;
          size_bytes?: number;
          uploaded_by?: string | null;
          width?: number | null;
          wp_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "media_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          name: string;
          option_values: Json;
          order_id: string;
          product_id: string | null;
          quantity: number;
          sku: string | null;
          total_cents: number;
          unit_price_cents: number;
          variant_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          option_values?: Json;
          order_id: string;
          product_id?: string | null;
          quantity: number;
          sku?: string | null;
          total_cents: number;
          unit_price_cents: number;
          variant_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          option_values?: Json;
          order_id?: string;
          product_id?: string | null;
          quantity?: number;
          sku?: string | null;
          total_cents?: number;
          unit_price_cents?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      order_notes: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          customer_visible: boolean;
          id: string;
          order_id: string;
        };
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          customer_visible?: boolean;
          id?: string;
          order_id: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          customer_visible?: boolean;
          id?: string;
          order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_notes_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          billing_address: Json;
          created_at: string;
          currency: string;
          customer_id: string | null;
          customer_note: string;
          discount_cents: number;
          email: string;
          id: string;
          livemode: boolean;
          number: number;
          paid_at: string | null;
          payment_method: string;
          shipping_address: Json;
          shipping_cents: number;
          shipping_method: string;
          status: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          subtotal_cents: number;
          total_cents: number;
          updated_at: string;
          vat_cents: number;
          wp_id: number | null;
        };
        Insert: {
          billing_address?: Json;
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          customer_note?: string;
          discount_cents?: number;
          email: string;
          id?: string;
          livemode?: boolean;
          number?: number;
          paid_at?: string | null;
          payment_method?: string;
          shipping_address?: Json;
          shipping_cents?: number;
          shipping_method?: string;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          subtotal_cents?: number;
          total_cents?: number;
          updated_at?: string;
          vat_cents?: number;
          wp_id?: number | null;
        };
        Update: {
          billing_address?: Json;
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          customer_note?: string;
          discount_cents?: number;
          email?: string;
          id?: string;
          livemode?: boolean;
          number?: number;
          paid_at?: string | null;
          payment_method?: string;
          shipping_address?: Json;
          shipping_cents?: number;
          shipping_method?: string;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          subtotal_cents?: number;
          total_cents?: number;
          updated_at?: string;
          vat_cents?: number;
          wp_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          hero_media_id: string | null;
          content: string;
          created_at: string;
          id: string;
          path: string;
          seo: Json;
          status: Database["public"]["Enums"]["publish_status"];
          title: string;
          updated_at: string;
          wp_id: number | null;
        };
        Insert: {
          hero_media_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          path: string;
          seo?: Json;
          status?: Database["public"]["Enums"]["publish_status"];
          title: string;
          updated_at?: string;
          wp_id?: number | null;
        };
        Update: {
          hero_media_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          path?: string;
          seo?: Json;
          status?: Database["public"]["Enums"]["publish_status"];
          title?: string;
          updated_at?: string;
          wp_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "pages_hero_media_id_fkey";
            columns: ["hero_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      post_categories: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          name: string;
          slug: string;
          wp_id: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          name: string;
          slug: string;
          wp_id?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          name?: string;
          slug?: string;
          wp_id?: number | null;
        };
        Relationships: [];
      };
      post_category_links: {
        Row: {
          category_id: string;
          post_id: string;
        };
        Insert: {
          category_id: string;
          post_id: string;
        };
        Update: {
          category_id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_category_links_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "post_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_category_links_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_tag_links: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_tag_links_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_tag_links_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "post_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      post_tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          wp_id: number | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          wp_id?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          wp_id?: number | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          hero_media_id: string | null;
          subtitle: string;
          author_id: string | null;
          content: string;
          created_at: string;
          excerpt: string;
          featured_media_id: string | null;
          id: string;
          published_at: string | null;
          seo: Json;
          slug: string;
          status: Database["public"]["Enums"]["publish_status"];
          title: string;
          updated_at: string;
          wp_id: number | null;
        };
        Insert: {
          hero_media_id?: string | null;
          subtitle?: string;
          author_id?: string | null;
          content?: string;
          created_at?: string;
          excerpt?: string;
          featured_media_id?: string | null;
          id?: string;
          published_at?: string | null;
          seo?: Json;
          slug: string;
          status?: Database["public"]["Enums"]["publish_status"];
          title: string;
          updated_at?: string;
          wp_id?: number | null;
        };
        Update: {
          hero_media_id?: string | null;
          subtitle?: string;
          author_id?: string | null;
          content?: string;
          created_at?: string;
          excerpt?: string;
          featured_media_id?: string | null;
          id?: string;
          published_at?: string | null;
          seo?: Json;
          slug?: string;
          status?: Database["public"]["Enums"]["publish_status"];
          title?: string;
          updated_at?: string;
          wp_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_hero_media_id_fkey";
            columns: ["hero_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_featured_media_id_fkey";
            columns: ["featured_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      product_categories: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          image_media_id: string | null;
          name: string;
          slug: string;
          sort_order: number;
          wp_id: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          image_media_id?: string | null;
          name: string;
          slug: string;
          sort_order?: number;
          wp_id?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          image_media_id?: string | null;
          name?: string;
          slug?: string;
          sort_order?: number;
          wp_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_categories_image_media_id_fkey";
            columns: ["image_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      product_category_links: {
        Row: {
          category_id: string;
          product_id: string;
        };
        Insert: {
          category_id: string;
          product_id: string;
        };
        Update: {
          category_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_category_links_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_category_links_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_media: {
        Row: {
          media_id: string;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          media_id: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          media_id?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_media_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_tag_links: {
        Row: {
          product_id: string;
          tag_id: string;
        };
        Insert: {
          product_id: string;
          tag_id: string;
        };
        Update: {
          product_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_tag_links_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_tag_links_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "product_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      product_tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          wp_id: number | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          wp_id?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          wp_id?: number | null;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          created_at: string;
          id: string;
          image_media_id: string | null;
          manage_stock: boolean;
          option_values: Json;
          price_cents: number;
          product_id: string;
          sale_price_cents: number | null;
          sku: string | null;
          sort_order: number;
          stock_quantity: number | null;
          stock_status: Database["public"]["Enums"]["stock_status"];
          updated_at: string;
          wp_id: number | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_media_id?: string | null;
          manage_stock?: boolean;
          option_values?: Json;
          price_cents: number;
          product_id: string;
          sale_price_cents?: number | null;
          sku?: string | null;
          sort_order?: number;
          stock_quantity?: number | null;
          stock_status?: Database["public"]["Enums"]["stock_status"];
          updated_at?: string;
          wp_id?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_media_id?: string | null;
          manage_stock?: boolean;
          option_values?: Json;
          price_cents?: number;
          product_id?: string;
          sale_price_cents?: number | null;
          sku?: string | null;
          sort_order?: number;
          stock_quantity?: number | null;
          stock_status?: Database["public"]["Enums"]["stock_status"];
          updated_at?: string;
          wp_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_image_media_id_fkey";
            columns: ["image_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          created_at: string;
          description: string;
          featured_media_id: string | null;
          id: string;
          manage_stock: boolean;
          name: string;
          options: Json;
          price_cents: number | null;
          sale_price_cents: number | null;
          seo: Json;
          short_description: string;
          sku: string | null;
          slug: string;
          sort_order: number;
          status: Database["public"]["Enums"]["publish_status"];
          stock_quantity: number | null;
          stock_status: Database["public"]["Enums"]["stock_status"];
          updated_at: string;
          wp_id: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string;
          featured_media_id?: string | null;
          id?: string;
          manage_stock?: boolean;
          name: string;
          options?: Json;
          price_cents?: number | null;
          sale_price_cents?: number | null;
          seo?: Json;
          short_description?: string;
          sku?: string | null;
          slug: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["publish_status"];
          stock_quantity?: number | null;
          stock_status?: Database["public"]["Enums"]["stock_status"];
          updated_at?: string;
          wp_id?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string;
          featured_media_id?: string | null;
          id?: string;
          manage_stock?: boolean;
          name?: string;
          options?: Json;
          price_cents?: number | null;
          sale_price_cents?: number | null;
          seo?: Json;
          short_description?: string;
          sku?: string | null;
          slug?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["publish_status"];
          stock_quantity?: number | null;
          stock_status?: Database["public"]["Enums"]["stock_status"];
          updated_at?: string;
          wp_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_featured_media_id_fkey";
            columns: ["featured_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          billing_address: Json;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          shipping_address: Json;
          stripe_customer_id: string | null;
          updated_at: string;
          username: string | null;
          wp_id: number | null;
        };
        Insert: {
          billing_address?: Json;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["app_role"];
          shipping_address?: Json;
          stripe_customer_id?: string | null;
          updated_at?: string;
          username?: string | null;
          wp_id?: number | null;
        };
        Update: {
          billing_address?: Json;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          shipping_address?: Json;
          stripe_customer_id?: string | null;
          updated_at?: string;
          username?: string | null;
          wp_id?: number | null;
        };
        Relationships: [];
      };
      redirects: {
        Row: {
          created_at: string;
          destination: string;
          hits: number;
          id: string;
          permanent: boolean;
          source: string;
        };
        Insert: {
          created_at?: string;
          destination: string;
          hits?: number;
          id?: string;
          permanent?: boolean;
          source: string;
        };
        Update: {
          created_at?: string;
          destination?: string;
          hits?: number;
          id?: string;
          permanent?: boolean;
          source?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      vehicle_media: {
        Row: {
          media_id: string;
          sort_order: number;
          vehicle_id: string;
        };
        Insert: {
          media_id: string;
          sort_order?: number;
          vehicle_id: string;
        };
        Update: {
          media_id?: string;
          sort_order?: number;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicle_media_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicles: {
        Row: {
          body_type: string;
          card_title: string;
          condition: string;
          content: string;
          created_at: string;
          cta_media_id: string | null;
          details: Json;
          external_url: string;
          id: string;
          image_media_id: string | null;
          listed_on: string | null;
          listing_status: string;
          price: string;
          seller_details: string;
          seo: Json;
          slug: string;
          status: Database["public"]["Enums"]["publish_status"];
          status_color: string;
          title: string;
          updated_at: string;
          wp_id: number | null;
          year: string;
        };
        Insert: {
          body_type?: string;
          card_title?: string;
          condition?: string;
          content?: string;
          created_at?: string;
          cta_media_id?: string | null;
          details?: Json;
          external_url?: string;
          id?: string;
          image_media_id?: string | null;
          listed_on?: string | null;
          listing_status?: string;
          price?: string;
          seller_details?: string;
          seo?: Json;
          slug: string;
          status?: Database["public"]["Enums"]["publish_status"];
          status_color?: string;
          title: string;
          updated_at?: string;
          wp_id?: number | null;
          year?: string;
        };
        Update: {
          body_type?: string;
          card_title?: string;
          condition?: string;
          content?: string;
          created_at?: string;
          cta_media_id?: string | null;
          details?: Json;
          external_url?: string;
          id?: string;
          image_media_id?: string | null;
          listed_on?: string | null;
          listing_status?: string;
          price?: string;
          seller_details?: string;
          seo?: Json;
          slug?: string;
          status?: Database["public"]["Enums"]["publish_status"];
          status_color?: string;
          title?: string;
          updated_at?: string;
          wp_id?: number | null;
          year?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_cta_media_id_fkey";
            columns: ["cta_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_image_media_id_fkey";
            columns: ["image_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      video_series: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          slug: string;
          sort_order: number;
          title: string;
          title_media_id: string | null;
          wp_id: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          slug: string;
          sort_order?: number;
          title: string;
          title_media_id?: string | null;
          wp_id?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          slug?: string;
          sort_order?: number;
          title?: string;
          title_media_id?: string | null;
          wp_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "video_series_title_media_id_fkey";
            columns: ["title_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      videos: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          published_at: string | null;
          series_id: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["publish_status"];
          title: string;
          updated_at: string;
          youtube_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          published_at?: string | null;
          series_id?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["publish_status"];
          title: string;
          updated_at?: string;
          youtube_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          published_at?: string | null;
          series_id?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["publish_status"];
          title?: string;
          updated_at?: string;
          youtube_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "videos_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "video_series";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_bulk_status: {
        Args: {
          target_table: string;
          target_ids: string[];
          new_status: "draft" | "published";
        };
        Returns: number;
      };

      admin_save_product: {
        Args: {
          gallery: string[];
          product: Json;
          target_id: string;
          variants: Json;
        };
        Returns: string;
      };
      reserve_shop_checkout: {
        Args: {
          checkout_id: string;
          customer: string | null;
          lines: Json;
          live: boolean;
          shipping: number;
          shipping_label: string;
          vat: number;
        };
        Returns: string;
      };
      purge_test_shop_checkouts: { Args: never; Returns: number };
      release_shop_checkout: {
        Args: { checkout_id: string };
        Returns: undefined;
      };
      complete_shop_checkout: {
        Args: {
          checkout_id: string;
          session_id: string;
          payment_intent: string | null;
          email_address: string;
          customer: string | null;
          billing: Json;
          shipping_address_input: Json;
          paid_total: number;
        };
        Returns: string;
      };
      post_authors: {
        Args: never;
        Returns: {
          full_name: string | null;
          id: string;
          username: string | null;
        }[];
      };
      admin_update_business: {
        Args: {
          new_owner: string;
          new_slug: string;
          new_status: Database["public"]["Enums"]["publish_status"];
          target: string;
        };
        Returns: undefined;
      };
      set_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"];
          target_user: string;
        };
        Returns: undefined;
      };
      username_available: { Args: { candidate: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "business_owner" | "customer";
      directory_term_kind: "vehicle" | "era" | "service" | "region";
      order_status:
        | "pending"
        | "processing"
        | "completed"
        | "cancelled"
        | "refunded"
        | "failed";
      publish_status: "draft" | "published";
      stock_status: "in_stock" | "out_of_stock" | "on_backorder";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "business_owner", "customer"],
      directory_term_kind: ["vehicle", "era", "service", "region"],
      order_status: [
        "pending",
        "processing",
        "completed",
        "cancelled",
        "refunded",
        "failed",
      ],
      publish_status: ["draft", "published"],
      stock_status: ["in_stock", "out_of_stock", "on_backorder"],
    },
  },
} as const;
