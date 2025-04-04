import { findHBSBlocks } from "@budibase/string-templates"
import { DatasourcePlus, SourceName } from "@budibase/types"
import sdk from "../../sdk"

const MYSQL_CONST_CHAR_REGEX = new RegExp(`"[^"]*"|'[^']*'`, "g")
const CONST_CHAR_REGEX = new RegExp(`'[^']*'`, "g")

function getConstCharRegex(sourceName: SourceName) {
  // MySQL clients support ANSI_QUOTES mode off, this is by default
  // but " and ' count as string literals
  if (sourceName === SourceName.MYSQL) {
    return MYSQL_CONST_CHAR_REGEX
  } else {
    return CONST_CHAR_REGEX
  }
}

function getBindingWithinConstCharRegex(
  sourceName: SourceName,
  binding: string
) {
  if (sourceName === SourceName.MYSQL) {
    return new RegExp(`[^']*${binding}[^']*'|"[^"]*${binding}[^"]*"`, "g")
  } else {
    return new RegExp(`'[^']*${binding}[^']*'`)
  }
}

export async function interpolateSQL(
  sourceName: SourceName,
  fields: { sql: string; bindings: any[] },
  parameters: { [key: string]: any },
  integration: DatasourcePlus,
  opts: { nullDefaultSupport: boolean }
) {
  let sql = fields.sql
  if (!sql || typeof sql !== "string") {
    return fields
  }
  const bindings = findHBSBlocks(sql)
  let variables = [],
    arrays = []
  for (let binding of bindings) {
    // look for array/list operations in the SQL statement, which will need handled later
    const listRegexMatch = sql.match(
      new RegExp(`(in|IN|In|iN)( )+[(]?${binding}[)]?`)
    )
    // check if the variable was used as part of a string concat e.g. 'Hello {{binding}}'
    // start by finding all the instances of const character strings
    const charConstMatch = sql.match(getConstCharRegex(sourceName)) || []
    // now look within them to see if a binding is used
    const charConstBindingMatch = charConstMatch.find((string: any) =>
      string.match(getBindingWithinConstCharRegex(sourceName, binding))
    )
    if (charConstBindingMatch) {
      let [part1, part2] = charConstBindingMatch.split(binding)
      part1 = `'${part1.substring(1)}'`
      part2 = `'${part2.substring(0, part2.length - 1)}'`
      sql = sql.replace(
        charConstBindingMatch,
        integration.getStringConcat([
          part1,
          integration.getBindingIdentifier(),
          part2,
        ])
      )
    }
    // generate SQL parameterised array
    else if (listRegexMatch) {
      arrays.push(binding)
      // determine the length of the array
      const value = (await sdk.queries.enrichContext([binding], parameters))[0]
        .split(",")
        .map((val: string) => val.trim())
      // build a string like ($1, $2, $3)
      let replacement = `${Array.apply(null, Array(value.length))
        .map(() => integration.getBindingIdentifier())
        .join(",")}`
      // check if parentheses are needed
      if (!listRegexMatch[0].includes(`(${binding})`)) {
        replacement = `(${replacement})`
      }
      sql = sql.replace(binding, replacement)
    } else {
      sql = sql.replace(binding, integration.getBindingIdentifier())
    }
    variables.push(binding)
  }
  // replicate the knex structure
  fields.sql = sql
  fields.bindings = await sdk.queries.enrichArrayContext(variables, parameters)
  if (opts.nullDefaultSupport) {
    for (let index in fields.bindings) {
      if (fields.bindings[index] === "") {
        fields.bindings[index] = null
      }
    }
  }
  // check for arrays in the data
  let updated: string[] = []
  for (let i = 0; i < variables.length; i++) {
    if (arrays.includes(variables[i])) {
      updated = updated.concat(
        fields.bindings[i].split(",").map((val: string) => val.trim())
      )
    } else {
      updated.push(fields.bindings[i])
    }
  }
  fields.bindings = updated
  return fields
}
