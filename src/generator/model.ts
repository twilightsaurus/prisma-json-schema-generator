import { DMMF } from '@prisma/generator-helper'
import { JSONSchema7Definition } from 'json-schema'
import { getJSONSchemaProperty } from './properties'
import { DefinitionMap, TransformOptions } from './types'

const getRelationFieldNames = (model: DMMF.Model): string[] => {
    return model.fields
        .filter((field) => field.relationFromFields || field.relationToFields)
        .map((field) => field.name)
}

export function getJSONSchemaModel(
    transformOptions: TransformOptions,
) {
    return (model: DMMF.Model): DefinitionMap => {
        const definitionPropsMap = model.fields.map(
            getJSONSchemaProperty(transformOptions),
        )

        const propertiesMap = definitionPropsMap.map(
            ([name, definition]) => [name, definition] as DefinitionMap,
        )
        const relationFieldNames = getRelationFieldNames(model)

        const definition: JSONSchema7Definition = {
            type: 'object',
            properties: {},
        }

        // Invert the logic: exclude relation fields if excludeRelationFields is true
        if (transformOptions.excludeRelationFields === 'true') {
            definition.properties = Object.fromEntries(
                propertiesMap.filter(
                    (prop) => !relationFieldNames.includes(prop[0]),
                ),
            )
        } else {
            definition.properties = Object.fromEntries(propertiesMap)
        }

        const required = definitionPropsMap.reduce(
            (filtered: string[], [name, , fieldMetaData]) => {
                if (fieldMetaData.required || fieldMetaData.hasDefaultValue) {
                    filtered.push(name)
                }
                return filtered
            },
            [],
        )
        if (required.length > 0) {
            definition.required = required
        }

        return [model.name, definition]
    }
}
