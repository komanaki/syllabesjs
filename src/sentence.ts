
interface Sentence {
    id?: number;
	start: number;
    end: number;
    duration: number;
    text?: string;
    position?: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
}