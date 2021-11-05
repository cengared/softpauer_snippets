<?php

function get_custom_fields($keyID = true)
{
  global $fields_table_name;

  $result = db_query("SELECT * FROM `{$fields_table_name}`", null);
  $fields = [];
  foreach ($result as $field) {
    if ($keyID) {
      $fields[$field->Field_ID] = $field->Field_Slug;
    } else {
      $fields[$field->Field_Slug] = $field->Field_ID;
    }
  }

  return $fields;
}

function get_product_data($product)
{
  global $fields_meta_table_name;

  $custom_fields = get_custom_fields();

  $query = "SELECT * FROM `{$fields_meta_table_name}` WHERE `Item_ID` = %d";
  $result = db_query($query, $product->Item_ID);
  $data = [];
  $data["item_id"] = $product->Item_ID;
  $data["item_slug"] = $product->Item_Slug;
  $data["item_photo_url"] = $product->Item_Photo_URL;
  $data["item_category"] = $product->Category_Name;
  $data["item_subcategory"] = $product->SubCategory_Name;

  foreach ($result as $meta) {
    $data[$custom_fields[$meta->Field_ID]] = $meta->Meta_Value;
  }

  return $data;
}

function get_tag_groups()
{
  global $tag_groups_table_name;

  $result = db_query("SELECT * FROM `{$tag_groups_table_name}`", null);
  $tag_groups = [];
  foreach ($result as $group) {
    $tag_groups[$group->Tag_Group_ID] = $group->Tag_Group_Name;
  }
  return $tag_groups;
}

function get_tag_data()
{
  global $tags_table_name;

  $result = db_query("SELECT * FROM `{$tags_table_name}`", null);
  $tags = [];
  foreach ($result as $tag) {
    $obj = new stdClass();
    $obj->name = $tag->Tag_Name;
    $obj->description = $tag->Tag_Description;
    $obj->item_count = (int) $tag->Tag_Item_Count;
    $obj->group = strtolower(get_tag_group_name($tag->Tag_Group_ID));
    $tags[$tag->Tag_ID] = $obj;
  }
  return $tags;
}

function get_tags_for_group($group_id)
{
  global $tags_table_name;

  $query = "SELECT * FROM `{$tags_table_name}` WHERE `Tag_Group_ID` = %d";
  $result = db_query($query, $group_id);
  $tags = [];
  foreach ($result as $tag) {
    $obj = new stdClass();
    $obj->name = $tag->Tag_Name;
    $obj->description = $tag->Tag_Description;
    $obj->item_count = (int) $tag->Tag_Item_Count;
    $tags[$tag->Tag_ID] = $obj;
  }
  return $tags;
}

function get_tagged_items($itemID)
{
  global $tagged_items_table_name;

  $query = "SELECT * FROM `{$tagged_items_table_name}` WHERE `Item_ID` = %d";
  $result = db_query($query, $itemID);
  $tags = [];
  foreach ($result as $tag) {
    array_push($tags, $tag->Tag_ID);
  }
  return $tags;
}

function group_tag_names($tag_ids)
{
  $tag_groups = [];
  foreach (get_tag_groups() as $group) {
    $tag_groups[strtolower($group)] = [];
  }

  $tags = get_tag_data();
  foreach ($tag_ids as $id) {
    array_push($tag_groups[$tags[$id]->group], $tags[$id]->name);
  }

  return array_filter($tag_groups);
}

function tag_name_to_id()
{
  $tag_data = get_tag_data();
  $tags = [];
  foreach ($tag_data as $id => $tag) {
    $tags[$tag->name] = $id;
  }
  return $tags;
}

function build_product_countries($tags)
{
  $country_tags = get_tags_for_group(1);
  $countries = [];
  foreach ($tags as $tag_id) {
    if ($country_tags[$tag_id]) {
      $tag = $country_tags[$tag_id];
      $country_code = iso_from_country($tag->name);
      array_push($countries, $country_code);
    }
  }
  return $countries;
}

function build_product_response($product)
{
  if (strlen($product["item_photo_url"]) == 0) {
    return false;
  }
  $response = [];
  $response["cmsId"] = (int) $product["item_id"];
  $response["internalId"] = $product["internal_id"];
  $response["image"] = $product["item_photo_url"];
  $response["thumbnail"] = str_replace(".png", "-150x150.png", $response["image"]);
  $response["itemNumbers"] = array_map('trim', explode(',', $product["item_number"]));
  $response["itemName"] = $product["product_name"];
  $response["uuid"] = is_set($product["uuid"]) ? $product["uuid"] : false;
  $response["bluetoothRegistration"] = is_set($product["bluetooth_registration"]) ? true : false;
  $response["bluetoothName"] = parse_json($product["bluetooth_name"]);
  $response["shop"] = parse_json($product["shop_links"]);
  $response["detailLink"] = parse_json($product["product_links"]);
  $response["videos"] = parse_json($product["videos"]);
  $response["duration"] = intval($product["interval"]);
  $response["allowWaterSavings"] = is_set($product["allow_water_savings"]) ? true : false;
  $response["hideServiceDate"] = is_set($product["not_show_service_date"]) ? true : false;
  $response["actionHeader"] = $product["device_action_header"];
  $response["actionBody"] = $product["device_action_body"];
  $response["circleText"] = $product["circle_text"];
  $states = is_set($product["states"]) ? array_map('trim', explode(',', $product["states"])) : false;
  if ($states) {
    foreach ($states as $state) {
      $response[$state] = build_product_state($product, $state);
    }
  }
  $product_tags = get_tagged_items($product["item_id"]);
  $response["category"] = $product["item_category"];
  $response["subcategory"] = $product["item_subcategory"];
  $response["capacity"] = intval($product["capacity"]);
  $response["countries"] = build_product_countries($product_tags);
  // $response["tags"] = group_tag_names($product_tags);

  return $response;
}

function build_product_state($product, $state, $action = false)
{
  $response = [];
  if ($state == "pure") $state = "ok";
  if ($action) {
    $response["overviewText"] = parse_overview_text(json_decode($product["{$state}_overview_text"])->$action);
    $response["statusLine"] = json_decode($product["{$state}_notification"])->$action;
    $response["statusText"] = json_decode($product["{$state}_recommendation"])->$action;
    $buttons = [];
    if ($product["button_1"])
      $buttons["actionButton"] = $product["button_1"];
    $button2_data = (array) json_decode($product["{$state}_button_2"], true);
    foreach ($button2_data[$action] as $key => $value) {
      if ($key == "buy") {
        $buttons["buy"] = $value;
      }
      if ($key == "subscribed") {
        $buttons["subscribed"] = "Subscribed";
      }
      if ($key == "contact") {
        $buttons["contact"] = "Contact partner";
      }
    }
    $response["buttons"] = $buttons;
  } else {
    $response["overviewText"] = parse_overview_text($product["{$state}_overview_text"]);
    $response["statusLine"] = $product["{$state}_notification"];
    $response["statusText"] = $product["{$state}_recommendation"];
    $buttons = [];
    if ($product["button_1"])
      $buttons["actionButton"] = $product["button_1"];
    $button2_data = (array) json_decode($product["{$state}_button_2"], true);
    foreach ($button2_data as $key => $value) {
      if ($key == "buy") {
        $buttons["buy"] = $value;
      }
      if ($key == "subscribed") {
        $buttons["subscribed"] = "Subscribed";
      }
      if ($key == "contact") {
        $buttons["contact"] = "Contact partner";
      }
    }
    $response["buttons"] = $buttons;
  }

  if ($state == "ok") {
    $response["colour"] = "blue";
  } else {
    $response["colour"] = "yellow";
  }
  if ($state == "warn" && is_set($product["show_low"])) {
    $response["showLow"] = true;
  } else {
    $response["showLow"] = false;
  }
  return $response;
}

function parse_json($data)
{
  if (!is_set($data)) {
    return false;
  }
  if (strpos($data, "{") === false) {
    return $data;
  }
  $json = @json_decode($data);
  if (json_last_error() !== JSON_ERROR_NONE) {
    return json_last_error_msg();
  }
  return $json;
}

function get_item_id($slug)
{
  global $items_table_name;
  $query = "SELECT `Item_ID` FROM `{$items_table_name}` WHERE `Item_Slug` = %s";
  return (int) db_get_var($query, $slug);
}

function get_category_name($id)
{
  global $categories_table_name;
  $query = "SELECT `Category_Name` FROM `{$categories_table_name}` WHERE `Category_ID` = %d";
  return db_get_var($query, $id);
}

function get_category_id($name)
{
  global $categories_table_name;
  $query = "SELECT `Category_ID` FROM `{$categories_table_name}` WHERE `Category_Name` = %s";
  return (int) db_get_var($query, $name);
}

function get_tag_name($id)
{
  global $tags_table_name;
  $query = "SELECT `Tag_Name` FROM `{$tags_table_name}` WHERE `Tag_ID` = %d";
  return db_get_var($query, $id);
}

function get_tag_id($name)
{
  global $tags_table_name;
  $query = "SELECT `Tag_ID` FROM `{$tags_table_name}` WHERE `Tag_Name` = %s";
  return (int) db_get_var($query, $name);
}

function get_tag_group_name($id)
{
  global $tag_groups_table_name;
  $query = "SELECT `Tag_Group_Name` FROM `{$tag_groups_table_name}` WHERE `Tag_Group_ID` = %d";
  return db_get_var($query, $id);
}

function get_tag_group_id($name)
{
  global $tag_groups_table_name;
  $query = "SELECT `Tag_Group_ID` FROM `{$tag_groups_table_name}` WHERE `Tag_Group_Name` = %s";
  return (int) db_get_var($query, $name);
}

function build_product_request($post)
{
  return [
    "Item_Name" => $post["item_name"],
    "Item_Slug" => $post["item_slug"],
    "Item_Description" => "",
    "Item_Sale_Mode" => "No",
    "Item_Link" => "",
    "Item_Photo_URL" => $post["image_url"],
    "Category_ID" => $post["category_id"],
    "Category_Name" => $post["category_name"],
    "Item_Special_Attr" => "",
    "SubCategory_Name" => "",
    "Item_Display_Status" => "Show",
    "Item_Related_Products" => "",
    "Item_Next_Previous" => "",
    "Item_SEO_Description" => "",
  ];
}

function build_product_meta($post)
{
  $meta = [];
  foreach (get_custom_fields() as $key => $value) {
    array_push($meta, [
      "Field_ID" => $key,
      "Item_ID" => $post['Item_ID'],
      "Meta_Value" => $post[$value] ? $post[$value] : ""
    ]);
  }
  return $meta;
}

function parse_overview_text($string)
{
  $unitRegexes = [
    "/\?+ days/i" => "{dayCount, number} {dayCount, plural, one {day} other {days}}",
    "/\?+%/i" => "{percent, number, percent}"
  ];

  foreach ($unitRegexes as $pattern => $replacement) {
    $string = preg_replace($pattern, $replacement, $string);
  }
  return $string;
}

function is_set($field)
{
  return isset($field) && strlen(trim($field)) > 0;
}
