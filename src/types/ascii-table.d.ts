declare module 'ascii-table' {
  class AsciiTable {
    constructor(title?: string);
    
    /**
     * Set the table heading.
     */
    setHeading(...args: string[]): this;
    
    /**
     * Add a row to the table.
     */
    addRow(...args: any[]): this;
    
    /**
     * Set the alignment of a column.
     */
    setAlign(idx: number, direction: string): this;
    
    /**
     * Set the title of the table.
     */
    setTitle(title: string): this;
    
    /**
     * Convert the table to a string.
     */
    toString(): string;
    
    /**
     * Set the table width.
     */
    setWidth(idx: number, width: number): this;
  }
  
  export = AsciiTable;
}
