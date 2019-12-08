var init_logic = function () {
    let ta = document.getElementsByTagName("textarea")[0];
    let btn_advance = document.getElementById("adv");
    let btn_reset = document.getElementById("rst");
    let line = 0;
    let start = 0;
    let num_lines = 0;

    // display vars
    let l_acc = document.getElementById('label_acc');
    let l_bak = document.getElementById('label_bak');
    let l_tst = document.getElementById('label_tst');
    let l_stat = document.getElementById('status');

    let stack = {
        'data': new Array(),
        'index': 0,
        'empty': function () {
            return this.data.length == 0;
        },
        'push': function (a) {
            this.data.push(a);
        },
        'pop': function () {
            if (this.empty()) {
                throw new Error();
            }

            return this.data.pop();
        }
    };

    ta.value = "mov acc, 10\n\
main:\n\
sub 1\n\
cmp acc,0\n\
jeq end\n\
jmp main\n\
\n\
end:\n\
swp"


    ta.onblur = function () {
        // console.log("reset and compile");
        // cpu.reset();
        // cpu.compile(ta.value);
    }

    // error handling
    window.onerror = function (e) {
        l_stat.innerHTML = "<div style='color: #ff0000'>" + e + "</div>";
    };
    /// _________________________

    let line_positions = [];

    let values = ta.value.split("\n");
    num_lines = values.length;

    while (line < (num_lines)) {
        // ta.focus();
        // ta.selectionStart = start;
        // if (line == 0) {
        //     ta.selectionEnd = start + values[line].length;
        // } else {
        //     ta.selectionEnd = start + values[line].length + 1;
        // }
        if (line == 0) {
            line_positions.push({
                'begin': start,
                'end': start + values[line].length
            })
        } else {
            line_positions.push({
                'begin': start,
                'end': start + values[line].length + 1
            })
        }


        // update positions
        start += values[line].length + 1;
        line = line + 1;



        let empty = /^[\s]*$/g;
        if (empty.test(values[line])) {
            // skip this line
            start += values[line].length + 1;
            line = line + 1;
        }

        let label_tst = new RegExp("^[a-z]+\:$");
        if (label_tst.test(values[line])) {
            // skip this line
            start += values[line].length + 1;
            line = line + 1;
        }

    }
    /// _________________________


    let step = function () {


        // debugger;
        let lp = line_positions[cpu.get_pc()];

        ta.focus();
        ta.selectionStart = lp.begin;
        ta.selectionEnd = lp.end;




    };

    // configure buttons
    btn_advance.onclick = function () {


        if (cpu.memory.length == 0) {
            cpu.compile(ta.value);
        }

        // execute step
        // prototype. this will imply line mismatches
        cpu.execute();

        step();

        l_acc.innerText = cpu.get_acc();
        l_bak.innerText = cpu.get_bak();
        l_tst.innerText = cpu.get_flg();
    };

    btn_reset.onclick = function () {
        line = 0;
        start = 0;

        console.log("compiling");
        cpu.reset();
        cpu.compile(ta.value);
    };

    // test automatic playback
    // setInterval(step, 200);

};

// fills the empty space with blank spaces
// between instructions  to make the 
// highlighting more pleasant ;)
function fill_empty_space(e) {
    let split = e.value.split("\n");
    let text = "";

    for (i = 0; i < split.length; i++) {
        let line = split[i];
        let fill = clamp(e.cols - line.length);
        line += " ".repeat(fill);
        if (i == split.length - 1) {
            text += line;
        } else {
            text += line + "\n";
        }
    }
    e.value = text;
}

// clamp values below 0 to 0
function clamp(x) {
    return (x < 0) ? 0 : x;
}

/// logic
var cpu = {
    'labels': [],
    'memory': [],
    'set_acc': function (v) {
        this.registers.acc = v;
    },
    'add_acc': function (v) {
        if (v > 10000 || v < -10000) {
            throw new Error("Value out of range");
        }
        this.registers.acc += v;
    },
    'sub_acc': function (v) {
        if (v > 10000 || v < -10000) {
            throw new Error("Value out of range");
        }
        this.registers.acc -= v;
    },
    'mul_acc': function (v) {
        if (v > 100 || v < -100) {
            throw new Error("Value out of range");
        }
        this.registers.acc *= v;
    },
    'div_acc': function (v) {
        if (v == 0) {
            throw new Error("Can't divide by zero!")
        }

        if (v > 100 || v < -100) {
            throw new Error("Value out of range");
        }

        this.registers.acc /= v;
    },
    'mod_acc': function (v) {
        if (v < 1) {
            throw new Error("Can't divide by zero");
        }

        this.registers.acc %= v;
    },
    'get_acc': function (v) {
        return this.registers.acc;
    },
    'set_bak': function (v) {
        this.registers.bak = v;
    },
    'get_bak': function (v) {
        return this.registers.bak;
    },
    'set_flg': function (v) {
        this.registers.flg = v;
    },
    'get_flg': function () {
        return this.registers.flg;
    },
    'is_tst_zero': function () {
        return this.registers.flg == 0;
    },
    'is_tst_gtz': function () {
        return this.registers.flg > 0;
    },
    'is_tst_ltz': function () {
        return this.registers.flg < 0;
    },
    'set_pc': function (p) {
        this.registers.pc = p;
    },
    'get_pc': function () {
        return this.registers.pc;
    },
    'inc_pc': function () {
        this.registers.pc += 1;

        //  This resets the pc
        if (this.registers.pc == this.memory.length) {
            this.registers.pc = 0;
        }
    },
    'dec_pc': function () {
        if (this.registers.pc == 0) {
            return;
        }

        this.registers.pc -= 1;
    },
    'push_stack': function (v) {
        if (this.registers.sp == 0) {
            throw new Error("Stack overflow");
        }
        this.registers.stack[this.registers.sp--] = v;
    },
    'pop_stack': function () {
        if (this.registers.sp == 32) {
            return null;
        }
        return this.registers.stack[this.sp++];
    },

    'registers': {
        'acc': 0,
        'bak': 0,
        'flg': 0,
        'bak': 0,
        'pc': 0,
        'stack': [],
        'sp': 32
    },
    'reset': function () {
        this.memory = [];
        this.labels = [];
    },
    'reset_all': function () {
        this.memory = [];
        this.labels = [];
        this.registers.acc = 0;
        this.registers.bak = 0;
        this.registers.flg = 0;
    },
    'execute': function () {
        this.memory[this.get_pc()](this);
        this.inc_pc();
    },

    // this function 'compiles' the given code into
    // an array of instructions (functions in this case) modifying
    // the registers of the virtual cpu. 
    // the stream of token gets parsed and transformed into the appropriate function
    // calls. 
    //
    // TODO: implement the parser
    // TODO: match the program counter (pc) with the actual highlighting of code
    //       to make the actual execution more intuitive
    'compile': function (cc) {

        // clean up non-tokens
        let code = cc
            .replace(/\n/g, " ")
            .replace(/\,/g, " ")
            .split(" ")
            .map(function (v) {
                return v.toLowerCase();
            })
            .filter(function (v) {
                return v.length != 0;
            });

        // the 'lexer' stores all tokens
        // and returns the next
        let lex = {
            'pos': 0,
            'length': code.length,
            'stream': code,
            'next': function () {
                if (this.pos == this.length) {
                    // this.pos = 0;
                    throw new Error("End Of Stream");
                }
                // debugger;
                return this.stream[this.pos++];
            },
            'has_next': function () {
                return (this.pos) < this.length;
            }
        };


        // define a label stack to store the last defined
        // label. the next successfully parsed instruction 
        // is the pc's target. in case multiple labels are
        // being defined in succession, the first instruction
        // location will become the address of all preceeding 
        // labels. 
        let label_stack = [];
        let seen_label = 0;

        while (lex.has_next()) {
            // check, if the last instruction was not a label
            if (seen_label == 0) {

                // since, we're only looking at the last instruction,
                // we can assume it is the last entry.
                let index = this.memory.length - 1;

                while (label_stack.length != 0) {
                    let _label = label_stack.pop();
                    this.labels[_label] = index;
                }
            }

            seen_label -= 1;
            if (seen_label < 0) {
                seen_label = 0;
            }

            let symbol = lex.next();
            switch (symbol) {
                case 'mov':
                    let target = lex.next();
                    switch (target) {
                        case 'acc':  // mov instruction
                            {
                                let source = lex.next();
                                switch (source) {
                                    case 'bak':
                                        this.memory.push(function (a) {
                                            a.set_acc(a.get_bak());
                                        });
                                        break;
                                    case 'acc':
                                        this.memory.push(function (a) {
                                            a.set_acc(a.get_acc());
                                        })
                                        break;
                                    case 'flg':
                                        this.memory.push(function (a) {
                                            a.set_acc(a.get_flg());
                                        })
                                        break;
                                    default:
                                        let r_number = /[0-9]+/g;
                                        if (!r_number.test(source)) {
                                            throw new Error("Not a number: ", source, "__");
                                        }

                                        this.memory.push(function (a) {
                                            a.set_acc(parseInt(source));
                                        })
                                }
                                break;
                            }
                        case 'flg': // mov instruction
                            {
                                let source = lex.next();
                                switch (source) {
                                    case 'bak':
                                        this.memory.push(function (a) {
                                            a.set_flg(a.get_bak());
                                        });
                                        break;
                                    case 'acc':
                                        this.memory.push(function (a) {
                                            a.set_flg(a.get_acc());
                                        })
                                        break;
                                    case 'flg':
                                        this.memory.push(function (a) {
                                            a.set_flg(a.get_flg());
                                        })
                                        break;
                                    default:

                                        if (r_number.test(source)) {
                                            throw new Error("Not a number");
                                        }

                                        this.memory.push(function (a) {
                                            a.set_flg(parseInt(source));
                                        })
                                }
                                break;
                            }
                        default:
                            throw new Error("Illegal Target Register: ", target);
                    }
                    break;
                case 'cmp':
                    {
                        let target = lex.next();

                        switch (target) {
                            case 'acc':
                                {
                                    let source = lex.next();
                                    switch (source) {
                                        case 'acc':
                                            this.memory.push(function (a) {
                                                a.set_flg(0);
                                            });
                                            break;
                                        case 'bak':
                                            this.memory.push(function (a) {
                                                if (a.get_acc() > a.get_bak()) {
                                                    this.set_flg(1);
                                                }
                                                else if (a.get_acc() < a.get_bak()) {
                                                    this.set_flg(-1);
                                                }
                                                else {
                                                    this.set_flg(0);
                                                }
                                            });
                                            break;
                                        case 'flg':
                                            this.memory.push(function (a) {
                                                if (a.get_acc() > a.get_flg()) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_acc() < a.get_flg()) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }
                                            });
                                            break;
                                        default:
                                            let r_number = new RegExp("^[0-9]+$");
                                            if (!r_number.test(source)) {
                                                throw new Error("Not a number");
                                            }

                                            this.memory.push(function (a) {
                                                let number = parseInt(source);

                                                if (a.get_acc() > number) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_acc() < number) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }

                                            })
                                            break;
                                    }
                                }
                                break;
                            case 'bak':
                                {
                                    let source = lex.next();
                                    switch (source) {
                                        case 'bak':
                                            this.memory.push(function (a) {
                                                a.set_flg(0);
                                            });
                                            break;
                                        case 'acc':
                                            this.memory.push(function (a) {
                                                if (a.get_bak() > a.get_acc()) {
                                                    this.set_flg(1);
                                                }
                                                else if (a.get_bak() < a.get_acc()) {
                                                    this.set_flg(-1);
                                                }
                                                else {
                                                    this.set_flg(0);
                                                }
                                            });
                                            break;
                                        case 'flg':
                                            this.memory.push(function (a) {
                                                if (a.get_bak() > a.get_flg()) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_bak() < a.get_flg()) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }
                                            });
                                            break;
                                        default:
                                            if (r_number.test(source)) {
                                                throw new Error("Not a number");
                                            }

                                            this.memory.push(function (a) {
                                                let number = parseInt(source);

                                                if (a.get_bak() > number) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_bak() < number) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }

                                            })
                                            break;
                                    }
                                }
                                break;
                            case 'flg':
                                {
                                    let source = lex.next();
                                    switch (source) {
                                        case 'flg':
                                            this.memory.push(function (a) {
                                                a.set_flg(0);
                                            });
                                            break;
                                        case 'bak':
                                            this.memory.push(function (a) {
                                                if (a.get_flg() > a.get_bak()) {
                                                    this.set_flg(1);
                                                }
                                                else if (a.get_flg() < a.get_bak()) {
                                                    this.set_flg(-1);
                                                }
                                                else {
                                                    this.set_flg(0);
                                                }
                                            });
                                            break;
                                        case 'acc':
                                            this.memory.push(function (a) {
                                                if (a.get_flg() > a.get_flg()) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_flg() < a.get_flg()) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }
                                            });
                                            break;
                                        default:
                                            if (r_number.test(source)) {
                                                throw new Error("Not a number");
                                            }

                                            this.memory.push(function (a) {
                                                let number = parseInt(source);

                                                if (a.get_flg() > number) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_flg() < number) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }

                                            })
                                            break;
                                    }
                                }
                                break;
                            default:
                                throw new Error("Illegal Target Register: ", target);
                        }
                    }
                    break;
                case 'jmp':

                    {
                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }
                        this.memory.push(function (a) {
                            if (a.labels[label] == null) {
                                throw new Error("Label not found: ", label);
                            }
                            a.set_pc(a.labels[label] - 1);
                        });
                        break;
                    }
                case 'jeq':
                    {
                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }
                        this.memory.push(function (a) {
                            if (a.get_flg() == 0) {
                                a.set_pc(a.labels[label] - 1);
                            }
                        });


                        break;
                    }
                case 'jne':
                    {
                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        this.memory.push(function (a) {
                            if (a.get_flg() != 0) {
                                a.set_pc(a.labels[label] - 1);
                            }
                        });

                        break;
                    }
                case 'jez': // duplicate?
                    {
                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        this.memory.push(function (a) {
                            if (a.get_flg() == 0) {
                                a.set_pc(a.labels[label] - 1);
                            }
                        });

                        break;
                    }
                case 'jgz':
                    {

                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        this.memory.push(function (a) {
                            if (a.get_flg() > 0) {
                                a.set_pc(a.labels[label] - 1);
                            }
                        });

                        break;
                    }
                case 'jlz':
                    {
                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }
                        this.memory.push(function (a) {
                            if (a.get_flg() < 0) {
                                a.set_pc(a.labels[label] - 1);
                            }
                        });

                        break;
                    }
                case 'add':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function (a) {
                                    a.add_acc(a.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function (a) {
                                    a.add_acc(a.get_bak());
                                });
                                break;
                            default:
                                let r_number = /^[0-9]+$/g;
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function (a) {
                                    let number = parseInt(next);
                                    a.add_acc(number);
                                });
                        }
                        break;
                    }
                case 'sub':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function (a) {
                                    a.sub_acc(a.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function (a) {
                                    a.sub_acc(a.get_bak());
                                });
                                break;
                            default:
                                let r_number = /^[0-9]+$/g;
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }
                                this.memory.push(function (a) {
                                    let number = parseInt(next);
                                    a.sub_acc(number);
                                });
                        }
                        break;
                    }
                case 'mul':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function (a) {
                                    a.mul_acc(a.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function (a) {
                                    a.mul_acc(a.get_bak());
                                });
                                break;
                            default:
                                let r_number = /^[0-9]+$/g;
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function (a) {
                                    let number = parseInt(next);
                                    a.mul_acc(number);
                                });
                        }
                        break;
                    }
                case 'div':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function (a) {
                                    a.div_acc(a.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function (a) {
                                    a.div_acc(a.get_bak());
                                });
                                break;
                            default:
                                let r_number = /^[0-9]+$/g;
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function (a) {
                                    let number = parseInt(next);
                                    a.div_acc(number);
                                });
                        }
                        break;
                    }
                case 'mod':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function (a) {
                                    a.mod_acc(a.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function (a) {
                                    a.mod_acc(a.get_bak());
                                });
                                break;
                            default:
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function (a) {
                                    let number = parseInt(next);
                                    a.mod_acc(number);
                                });
                        }
                        break;
                    }
                case 'swp':
                    this.memory.push(function (a) {
                        let acc = a.get_acc();
                        a.set_acc(a.get_bak());
                        a.set_bak(acc);
                    })
                    break;
                case 'psh':
                    this.memory.push(function (a) {
                        a.push_stack(a.get_acc());
                    })
                    break;
                case 'pop':
                    this.memory.push(function (a) {
                        a.set_acc(a.pop_stack());
                    })
                    break;
                case 'nop':
                    this.inc_pc();
                    break;

                default:
                    let r_label_def = new RegExp("^[a-z]+\:$");
                    if (!r_label_def.test(symbol)) {
                        throw new Error("Illegal Symbol: ", symbol, "here");
                    }
                    let label = symbol.replace(":", "");
                    label_stack.push(label);
                    seen_label += 1;
            }
        } // end parsing

        // clear labelstack
        // check, if the last instruction was not a label
        if (seen_label == 0) {

            // since, we're only looking at the last instruction,
            // we can assume it is the last entry.
            let index = this.memory.length - 1;

            while (label_stack.length != 0) {
                let _label = label_stack.pop();
                this.labels[_label] = index;
            }
        }

        seen_label -= 1;
        if (seen_label < 0) {
            seen_label = 0;
        }


        // debugger;
    }
} // end cpu def



