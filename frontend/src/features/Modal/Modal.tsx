import './Modal.css'
import type { ReactNode } from 'react'

interface IModalProps {
    modalContent: ReactNode
}

function Modal({ modalContent }: IModalProps) {

    return (

        <div className="modal-box">
            {modalContent}
        </div>

    )
}

export default Modal
