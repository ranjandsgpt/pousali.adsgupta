export interface CsvStructureValidatorInput {
  header: string[];
  rows: (string[] | unknown[])[];
}

export interface CsvStructureValidatorOutput {
  malformedRows: number[];
}

export function runCsvStructureValidator(input: CsvStructureValidatorInput): CsvStructureValidatorOutput {
  const expectedLength = input.header.length;
  const malformedRows: number[] = [];

  input.rows.forEach((row, index) => {
    if (!Array.isArray(row)) return;
    if (row.length !== expectedLength) malformedRows.push(index);
  });

  return { malformedRows };
}

