# Virtual Assembly Interpreter in Javascript (VASM)

This project implements a fictional assembly language interpreter in javascript. The main purpose of this project is to get acquainted with (toy) assembly languages, and the concepts behind it. 

## Quickstart

Everything is handled and done via `make` and docker. To install emberjs, call
the target:

```Make
make install.ember
``` 

This will create a new docker image called `emberjs` in your local docker repository. Next the application needs to be build. Run
```Make
make setup
``` 
This will install all npm dependencies.

To launch the application just run:

```
make
```

This will start `ember serve` on the code repository. A small message will show on the console, how to access the application via the browsers.

Per default it should be [http://localhost:4200](http://localhost:4200)

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

# Example Code

The following example code initializes `acc` with `0`
and loops, adding `1` on each iteration, `swp` the result of `acc` to
`bak` returning to the beginning of the list of instructions.

```
begin:              
mov acc, 0          
                    
loop:               
add 1               
cmp acc, 10         
jeq end             
jmp loop            
                    
end:                
swp                 
jmp begin           
```

# Parser Internals

The VASM parsers is technically a LR(1) parser that reads a symbol at a time, looks the next symbol(token), and creates an instruction in form of a javascript function, that will be pushed at the end of the list of instructions. It sucessfully handles labels (jump targets), by pushing the seen label into a temporary stack. If the next token is an instruction, the temporary label stack is being cleared, and the respective label will be stored with the address of that instruction ( which effectively simulates the program counter or "pc"). Since, we simply do not to handle memory addresses directly ( but indeces of the list of instructions), we don't have to calculate the memory offsets all by ourselfes, which makes things quite easy. 

# TODO

- convert logic into ember component