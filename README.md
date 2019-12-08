# Virtual Assembly Interpreter in Javascript (VASM)

This project implements a fictional assembly language interpreter in javascript. The main purpose of this project is to get acquainted with (toy) assembly languages, and the concepts behind it. 

## Instruction Set 

The following tables give an overview of the instructions, the memory layout, and the registers.

__abbreviations__
* Register (R)
* Number (N)


| OpCode            | Description                                            |
|:------------------|:-------------------------------------------------------|
| jmp      <label>  | unconditional jump                                     |
| jeq      <label>  | jump, if FLG register == 0                             |
| jne      <label>  | jump, if FLG register != 0                             |
| jez      <label>  | jump, if FLG register == 0 (?)                         |
| jgz      <label>  | jump, if FLG register > 0                              |
| jlz      <label>  | jump, if FLG register < 0                              |
| add      R / N    |                                                        |
| sub      R / N    |                                                        |
| div      R / N    |                                                        |
| mul      R / N    |                                                        |
| mod      R / N    |                                                        |
| mov      R, R / N |                                                        |
| tst   R, R/N      | tests, if target and source are the same. modifies FLG |
| swp      <none>   | swaps acc and bak                                      |
| psh      <none>   | push a value to the stack                              |
| pop      <none>   | pops a value from the stack                            |
| nop               | no operation                                           |
| swp     R / N     | swp acc with bak                                       |


## Future Opcodes (not implemented yet)


| OpCode        | Description       |
|:--------------|:------------------|
| shl     R / N | shift acc left    |
| shr     R / N | shift acc right   |
| xor     R / N | (bitwise) xor acc |
| orr     R / N | (bitwise) or acc  |
| and     R / N | (bitwise) and acc |



### Registers

VASM consists of four registers

| Register | Description                                                                                             |
|:---------|:--------------------------------------------------------------------------------------------------------|
| ACC      | A general purpose registers called the accumulator. All operations are done on this register.           |
| BAK      | A backup register. Cannot be directly written to, but read from.                                        |
| FLG      | The flag register. The main purpose of this register is to store information on operations done on acc. |


### Future Registers

| Register | Description                                                                   |
|:---------|:------------------------------------------------------------------------------|
| (LFT)    | Access data from left port                                                    |
| (RGH)    | Access data from right port                                                   |
| (TOP)    | Access data from top port                                                     |
| (BOT)    | Access data from bottom port                                                  |
| (LST)    | Access data from last port                                                    |
| (ANY)    | Access data from any port, whatever provides data first                       |
| (ZER)    | A zero registers. This mainly does nothing, when read from it provides a zero |

# TODO

## 1
Convert the list of instructions into a map structure to easily find labels. 
The problem is how to structure the calls with certain labels. 
One idea would be to store a structure that contains following information:

```javascript
var ins_graph = {
    'labels' : [],
    'next_label: "" 
}
``` 

The structure contains a map of labels to a 
list of instructions, as well as a reference 
to the adjactent label to call, if the end of 
instruction has reached, but a label directly follows, and the 