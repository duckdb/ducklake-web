---
layout: docu
title: Types
---

## Data Types
DuckLake specifies multiple data types for field values.

{{{"boolean", LogicalTypeId::BOOLEAN},
 {"int8", LogicalTypeId::TINYINT},
 {"int16", LogicalTypeId::SMALLINT},
 {"int32", LogicalTypeId::INTEGER},
 {"int64", LogicalTypeId::BIGINT},
 {"int128", LogicalTypeId::HUGEINT},
 {"uint8", LogicalTypeId::UTINYINT},
 {"uint16", LogicalTypeId::USMALLINT},
 {"uint32", LogicalTypeId::UINTEGER},
 {"uint64", LogicalTypeId::UBIGINT},
 {"uint128", LogicalTypeId::UHUGEINT},
 {"float32", LogicalTypeId::FLOAT},
 {"float64", LogicalTypeId::DOUBLE},
 {"decimal", LogicalTypeId::DECIMAL},
 {"time", LogicalTypeId::TIME},
 {"date", LogicalTypeId::DATE},
 {"timestamp", LogicalTypeId::TIMESTAMP},
 {"timestamp_us", LogicalTypeId::TIMESTAMP},
 {"timestamp_ms", LogicalTypeId::TIMESTAMP_MS},
 {"timestamp_ns", LogicalTypeId::TIMESTAMP_NS},
 {"timestamp_s", LogicalTypeId::TIMESTAMP_SEC},
 {"timestamptz", LogicalTypeId::TIMESTAMP_TZ},
 {"timetz", LogicalTypeId::TIME_TZ},
 {"interval", LogicalTypeId::INTERVAL},
 {"varchar", LogicalTypeId::VARCHAR},
 {"blob", LogicalTypeId::BLOB},
 {"uuid", LogicalTypeId::UUID}}};


  switch (type.id()) {
  case LogicalTypeId::STRUCT:
    return "struct";
  case LogicalTypeId::LIST:
    return "list";
  case LogicalTypeId::MAP:
    return "map";
  case LogicalTypeId::DECIMAL:
    return "decimal(" + to_string(DecimalType::GetWidth(type)) + "," + to_string(DecimalType::GetScale(type)) + ")";
  case LogicalTypeId::VARCHAR:
    if (!StringType::GetCollation(type).empty()) {
      throw InvalidInput