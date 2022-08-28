// just some notes here for the future

// we can use this lichess api to get the tablebase result for a given fen
// https://github.com/lichess-org/lila-tablebase#http-api
// the api will return this interface RootObject
/*
interface Move {
  uci: string;
  san: string;
  zeroing: boolean;
  checkmate: boolean;
  stalemate: boolean;
  variant_win: boolean;
  variant_loss: boolean;
  insufficient_material: boolean;
  dtz: number;
  precise_dtz: number;
  dtm: number;
  category: string;
}

export interface RootObject {
  checkmate: boolean;
  stalemate: boolean;
  variant_win: boolean;
  variant_loss: boolean;
  insufficient_material: boolean;
  dtz: number;
  precise_dtz: number;
  dtm: number;
  category: string;
  moves: Move[];
}
*/
