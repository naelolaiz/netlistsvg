import { beautifyCellTypeLabel } from '../lib/labels';

test('beautify Verilog paramod labels', () => {
    expect(beautifyCellTypeLabel(
        "$paramod\\shift_register\\WIDTH=s32'00000000000000000000000000010000"))
        .toEqual('shift_register');
    expect(beautifyCellTypeLabel('$paramod$181d5ecaceac80727420f5bd162c857e92d1cc8a\\rom_lut'))
        .toEqual('rom_lut');
});

test('beautify GHDL generated architecture labels', () => {
    expect(beautifyCellTypeLabel('single_clock_rom_Brtl_32_9')).toEqual('single_clock_rom');
    expect(beautifyCellTypeLabel('nco_sine_Brtl')).toEqual('nco_sine');
});

test('beautify primitive and bus-suffixed labels', () => {
    expect(beautifyCellTypeLabel('$mem_v2')).toEqual('RAM');
    expect(beautifyCellTypeLabel('$mux-bus-bus')).toEqual('mux');
});

test('prefer explicit HDL name when available', () => {
    expect(beautifyCellTypeLabel('$paramod\\ignored\\WIDTH=1', 'clean_name')).toEqual('clean_name');
});
