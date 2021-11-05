<?php

class BWT_CMS_Rest extends WP_REST_Controller
{
  //The namespace and version for the REST SERVER
  var $my_namespace = 'bwt/v';
  var $my_version   = '1';

  public function register_routes()
  {
    $namespace = $this->my_namespace . $this->my_version;
    register_rest_route(
      $namespace,
      '/products',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_products'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
    register_rest_route(
      $namespace,
      '/products/(?P<id>[\S]+)',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_products'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
    register_rest_route(
      $namespace,
      '/productsbyid',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_products_by_id'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
    register_rest_route(
      $namespace,
      '/productsbyid/(?P<id>[\S]+)',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_products_by_id'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
    register_rest_route(
      $namespace,
      '/products',
      [
        [
          'methods' => WP_REST_Server::CREATABLE,
          'callback' => [$this, 'add_product'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
    register_rest_route(
      $namespace,
      '/fields',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_field_data'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
    register_rest_route(
      $namespace,
      '/categories',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_categories'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
    register_rest_route(
      $namespace,
      '/tags/',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_tags'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
    register_rest_route(
      $namespace,
      '/tags/(?P<id>[\d]+)',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_group_tags'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
    register_rest_route(
      $namespace,
      '/countries',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_country_tags'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
    register_rest_route(
      $namespace,
      '/updateslugs',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'update_item_slugs'],
          'permission_callback' => [$this, 'get_permission']
        ]
      ]
    );
  }

  // Register cms REST Server
  public function hook_rest_server()
  {
    add_action('rest_api_init', [$this, 'register_routes']);
  }

  public function get_permission()
  {
    // return true; // while developing api
    if ((isset($_SERVER['HTTP_AUTHORIZATION']) && $_SERVER['HTTP_AUTHORIZATION'] === 'Basic Ynd0LWNtczpaWlgxTjNkcHNWMkt4eEZj') || current_user_can('edit_posts')) {
      return true;
    }
    return new WP_Error(-401, esc_html__("forbidden", 'bwt-cms'), ['status' => 401]);
  }

  public function get_products(WP_REST_Request $request)
  {
    global $items_table_name;

    $query = "SELECT * FROM `{$items_table_name}`";
    $error = new WP_Error(-100, esc_html__("No products found", 'bwt-cms'), ['status' => 404]);
    $like = null;

    if ($request['id']) {
      $id = $request['id'];
      $query = "SELECT * FROM `{$items_table_name}` WHERE `Item_Slug` LIKE %s";
      $like = "%" . esc_like($id) . "%";
      $error = new WP_Error(-101, esc_html__("Product {$id} not found", 'bwt-cms'), ['status' => 404]);
    }

    $result = db_query($query, $like);
    if (!$result || empty($result)) {
      return $error;
    }

    $products = [];
    foreach ($result as $product) {
      array_push($products, get_product_data($product));
    }

    $response = [];
    foreach ($products as $product) {
      $product_response = build_product_response($product);
      if ($product_response)
        array_push($response, $product_response);
    }

    return new WP_REST_Response($response);
  }

  public function add_product(WP_REST_Request $request)
  {
    global $items_table_name, $fields_meta_table_name, $tags_table_name, $tagged_items_table_name;

    $data = $request->get_json_params();
	  
    if (!isset($data['item_slug']) || $data['item_slug'] === "") {
      $formattedName = str_replace(' ', '-', strtolower($data['product_name']));
      $slugString = "";
      foreach ($data['item_number'] as $item_number) {
        $slugString .= "_{$item_number}";
      }
      $data['item_slug'] = $formattedName . $slugString;
    }

    if (!isset($data['internal_id']) || $data['internal_id'] === "") {
      $data['internal_id'] = $formattedName . "_" . $data['item_number'][0];
    }
	  
    if (get_item_id($data['item_slug'])) {
      return new WP_Error(-40, esc_html__("Product slug {$data['item_slug']} already exists", 'bwt-cms'), ['status' => 400]);
    }

    if (!isset($data['category_name'])) {
      if (!$name = get_category_name($data['category_id'])) {
        return new WP_Error(-41, esc_html__("Category ID {$data['category_id']} not found", 'bwt-cms'), ['status' => 404]);
      }
      $data['category_name'] = $name;
    }

    if (!isset($data['category_id'])) {
      if (!$id = get_category_id($data['category_name'])) {
        return new WP_Error(-42, esc_html__("Category ID {$data['category_name']} not found", 'bwt-cms'), ['status' => 404]);
      }
      $data['category_id'] = (int) $id;
    }

    $product = build_product_request($data);
    if (!db_insert($items_table_name, $product)) {
      return new WP_ERROR(-10, esc_html__("Error adding product", 'bwt-cms'), ['status' => 500]);
    }

    $data['Item_ID'] = (int) get_item_id($data['item_slug']);
    $data['item_number'] = implode(',', $data['item_number']);
    if (!isset($data['short_name'])) $data['short_name'] = $data['product_name'];

    $product_meta = build_product_meta($data);
    foreach ($product_meta as $meta) {
      if (!db_insert($fields_meta_table_name, $meta)) {
        return new WP_ERROR(-12, esc_html__("Error adding product meta data", 'bwt-cms'), ['status' => 500]);
      }
    }

    $tag_data = tag_name_to_id();
    foreach ($data['countries'] as $iso) {
      $country = country_from_iso($iso);
      $tag_id = $tag_data[$country];
      db_insert($tagged_items_table_name, [
        "Tag_ID" => $tag_id,
        "Item_ID" => $data['Item_ID']
      ]);
      db_query("UPDATE $tags_table_name SET Tag_Item_Count=Tag_Item_Count + 1 WHERE Tag_ID = %d", $tag_id);
    }

    return new WP_REST_Response($data['Item_ID']);
  }
	
  public function get_products_by_id(WP_REST_Request $request)
  {
    global $items_table_name;

    $response = [];

    if ($request['id']) {
      $id = $request['id'];
      $query = "SELECT * FROM `{$items_table_name}` WHERE `Item_ID` = %d";
      $result = db_query($query, $id);
      if (!$result || empty($result)) {
        return new WP_Error(-101, esc_html__("CMS {$id} not recognised", 'bwt-cms'), ['status' => 404]);
      }
      $products = [];
      foreach ($result as $product) {
        array_push($products, get_product_data($product));
      }

      foreach ($products as $product) {
        array_push($response, build_product_response($product));
      }
    } else {
      $query = "SELECT `Item_ID`  FROM `{$items_table_name}`";
      $result = db_query($query, null);
      if (!$result || empty($result)) {
        return new WP_Error(-100, esc_html__("No products found", 'bwt-cms'), ['status' => 404]);
      }
      foreach ($result as $id) {
        array_push($response, $id->Item_ID);
      }
    }

    return new WP_REST_Response($response);
  }

  public function get_field_data()
  {
    global $fields_table_name;

    $query = "SELECT * FROM `{$fields_table_name}`";
    $result = db_query($query, null);
    $fields = [];
    $states = ['OK', 'Warn', 'Urgent'];

    foreach ($states as $state) {
      $fields[strtolower($state)] = [];
    }

    foreach ($result as $r) {
      $field = new stdClass();
      $field->id = (int) $r->Field_ID;
      $field->slug = $r->Field_Slug;
      $field->name = $r->Field_Name;
      $field->type = $r->Field_Type;
      if ($r->Field_Description) {
        if ($r->Field_Description == 'translate') {
          $field->to_translate = true;
        } else {
          $field->description = $r->Field_Description;
        }
      }
      if ($r->Field_Values) {
        $field->values = $r->Field_Values;
      }
      foreach ($states as $state) {
        if (substr($field->slug, 0, strlen($state)) === strtolower($state)) {
          $field->name = str_replace("{$state}: ", "", $field->name);
          array_push($fields[strtolower($state)], $field);
          continue 2;
        }
      }
      array_push($fields, $field);
    }

    return new WP_REST_Response($fields);
  }

  public function get_categories()
  {
    global $categories_table_name;

    $query = "SELECT * FROM `{$categories_table_name}`";
    $result = db_query($query, null);
    $categories = [];
    foreach ($result as $r) {
      $category = new stdClass();
      $category->id = (int) $r->Category_ID;
      $category->name = $r->Category_Name;
      array_push($categories, $category);
    }
    return new WP_REST_Response($categories);
  }

  public function get_tags()
  {
    return new WP_REST_Response(get_tag_data());
  }

  public function get_group_tags(WP_REST_Request $request)
  {
    global $tag_groups_table_name;

    if ($request['id']) {
      $id = $request['id'];
      $query = "SELECT * FROM `{$tag_groups_table_name}` WHERE `Tag_Group_ID` LIKE %d";
      if (!db_query($query, $id))
        return new WP_Error(-104, esc_html__("Tag Group {$id} not found", 'bwt-cms'), ['status' => 404]);
    }
    return new WP_REST_Response(get_tags_for_group($id));
  }

  public function get_country_tags()
  {
    return new WP_REST_Response(get_tags_for_group(1));
  }

  public function update_item_slugs()
  {
    global $items_table_name, $fields_meta_table_name;

    $products = db_query("SELECT * FROM `{$items_table_name}`", null);
    $response = ['Updating product slugs...'];
    $query = "SELECT `Meta_Value` FROM `{$fields_meta_table_name}` WHERE `Item_ID` = %d AND `Field_ID` = 1";
    foreach ($products as $product) {
      $new_slug = str_replace(" ", "-", strtolower($product->Item_Name));
      $result = db_get_var($query, $product->Item_ID);
      foreach (explode(",", $result) as $id) {
        $new_slug .= "_" . trim($id);
      }
      if ($product->Item_Slug !== $new_slug) {
        db_update($items_table_name, ['Item_Slug' => $new_slug], ['Item_ID' => $product->Item_ID], ['%s'], ['%d']);
        $response[] = "{$product->Item_Name}: {$product->Item_Slug} --> {$new_slug}";
      }
    }
    return new WP_REST_Response($response);
  }
}

function db_query($query, $vars)
{
  global $wpdb;
  return $wpdb->get_results($wpdb->prepare($query, $vars));
}

function db_insert($table, $data)
{
  global $wpdb;
  return $wpdb->insert($table, $data);
}

function db_update($table, $data, $where, $format = null, $where_format = null)
{
  global $wpdb;
  return $wpdb->update($table, $data, $where, $format, $where_format);
}

function db_get_var($query, $var)
{
  global $wpdb;
  return $wpdb->get_var($wpdb->prepare($query, $var));
}

function esc_like($like)
{
  global $wpdb;
  return $wpdb->esc_like($like);
}
