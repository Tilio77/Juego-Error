import { useState, useEffect } from 'react';
import { GameStatus } from './types';
import { useWindow } from '../hooks/useWindow';
import { getWordOfTheDay, isValidWord } from '../service/request';
import RowCompleted from './rowCompleted';
import RowCurrent from './rowCurrent';
import RowEmpty from './rowEmpty';
import styles from './wordle.module.scss';
import Keyboard from './keyboard';
import Modal from './modal';

const keys = [
	'Q',
	'W',
	'E',
	'R',
	'T',
	'Y',
	'U',
	'I',
	'O',
	'P',
	'A',
	'S',
	'D',
	'F',
	'G',
	'H',
	'J',
	'K',
	'L',
	'Z',
	'X',
	'C',
	'V',
	'B',
	'N',
	'M',
];

export default function Wordle() {

	const [wordOfTheDay, setWordOfTheDay] = useState<string>('');
	const [turn, setTurn] = useState<number>(1);
	const [currentWord, setCurrentWord] = useState<string>('');
	const [completeWords, setCompleteWords] = useState<string[]>([]);
	const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Playing);

	useWindow('keydown', handleKeyDown);

	useEffect(() => {
    setWordOfTheDay(getWordOfTheDay());
  }, []);

	function handleKeyDown(event: KeyboardEvent) {
		const key = event.key.toUpperCase();

		onKeyPressed(key);
	}

	function onKeyPressed(key: string) {
		if (gameStatus !== GameStatus.Playing) {
			return;
		}

		if (key === 'BACKSPACE' && currentWord.length > 0){
			onDelete();
			return;
		}

		if (key === 'ENTER' && currentWord.length === 5 && turn <= 6){
			onEnter();
			return;
		}

		if (currentWord.length >= 5) return;

		// Ingresar la letra al estado
		if (keys.includes(key)){
			onInput(key);
			return;
		}
	}

	function onInput(letter:string){
		const newWord = currentWord + letter;
		setCurrentWord(newWord);
	}

	function onDelete() {
		const newWord = currentWord.slice(0, -1);
		setCurrentWord(newWord);
	}

	 async function onEnter() {
		if(currentWord === wordOfTheDay) {
			// Ganó el usuario.
			setCompleteWords([...completeWords, currentWord]);
			setGameStatus(GameStatus.Won);
			return;
		}

		if(turn === 6) {
			// Perdió el usuario.
			setCompleteWords([...completeWords, currentWord]);
			setGameStatus(GameStatus.Lost);
			return;
		}

		// Validar si existe la palabra.
		const validWord = await isValidWord(currentWord)
		if (currentWord.length === 5 && await !validWord) {
			alert('Not a valid word');
			return;
		}

		setCompleteWords([...completeWords, currentWord]);
		setTurn(turn + 1);
		setCurrentWord('');
	}

	return(
		<>
			{gameStatus === GameStatus.Won ? (
				<Modal
					type="won"
					completeWords={completeWords} 
					solution={wordOfTheDay} 
				/>
			) : gameStatus === GameStatus.Lost ? (
				<Modal 
					type="lost" 
					completeWords={completeWords} 
					solution={wordOfTheDay} 
				/>
			) : null}
			<div className={styles.mainContainer}>
			{completeWords.map((word, i) => (
					<RowCompleted key={i} word={word} solution={wordOfTheDay} />
				))}

			{gameStatus === GameStatus.Playing ? (
				<RowCurrent word={currentWord} />
			) : null}

			{
				Array.from(Array(6 - turn)).map((_, i) => (
					<RowEmpty key={i} />
				))
			}
		</div>
		<Keyboard 
			keys={keys} 
			onKeyPressed={onInput}
		/>
		</>
	);
}